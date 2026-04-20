"use client"

import { useEffect, useMemo, useState } from "react"
import { Drawer } from "vaul"
import {
  Banknote,
  CreditCard,
  Loader2,
  MapPin,
  QrCode,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAnalytics } from "@/components/AnalyticsProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { agruparItens } from "@/features/carrinho/agruparItens"
import { calcularPrecoEntrega } from "@/features/carrinho/calcularEntrega"
import {
  calcularEntregaComCupom,
  DELIVERY_FREE_COUPON_MIN_SUBTOTAL,
} from "@/features/carrinho/cupomEntrega"
import { useCarrinho } from "@/hooks/useCarrinho"
import { reportGoogleAdsConversion } from "@/lib/googleAds"
import {
  criarLinkGoogleMaps,
  extrairCoordenadasDoLink,
  formatarCoordenadas,
} from "@/lib/maps"
import { reportMetaInitiateCheckout, reportMetaLead } from "@/lib/metaPixel"
import { postJsonInBackground } from "@/lib/postJsonInBackground"
import { WHATSAPP_NUMBER } from "@/lib/site"
import { cn } from "@/lib/utils"
import type {
  Coordenadas,
  LocalizacaoSalva,
  MetodoPagamento,
  PagamentoPedido,
} from "@/types/carrinho"

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const MENSAGEM_SEM_LOCALIZACAO =
  "Localização pendente. Por favor, envie a localização fixa após concluir o pedido."
const MENSAGEM_COM_LOCALIZACAO =
  "Confira se o endereço está completo com número da casa e informe um telefone de contato para facilitar a entrega."

const paymentOptions: Array<{
  id: MetodoPagamento
  label: string
  icon: typeof QrCode
  description: string
}> = [
  {
    id: "pix",
    label: "Pix",
    icon: QrCode,
    description: "Pagamento combinado no WhatsApp.",
  },
  {
    id: "cartao",
    label: "Cartão",
    icon: CreditCard,
    description: "Crédito ou débito na entrega.",
  },
  {
    id: "dinheiro",
    label: "Dinheiro",
    icon: Banknote,
    description: "Confirme se precisa de troco.",
  },
]

type EstadoPermissao = PermissionState | "unknown" | "unsupported"

function isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
  return typeof error === "object" && error !== null && "code" in error
}

function isAppleMobileDevice() {
  if (typeof navigator === "undefined") return false

  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function isInAppBrowser() {
  if (typeof navigator === "undefined") return false

  return /Instagram|FBAN|FBAV|Line|MicroMessenger/i.test(navigator.userAgent)
}

function getLocationStatusLabel(status: EstadoPermissao) {
  switch (status) {
    case "granted":
      return "Permitida"
    case "denied":
      return "Bloqueada"
    case "prompt":
      return "Pendente"
    case "unknown":
      return "Solicitar"
    default:
      return "Sem suporte"
  }
}

function getLocationErrorMessage(error: unknown) {
  const usandoIphone = isAppleMobileDevice()
  const usandoNavegadorInterno = isInAppBrowser()

  if (isGeolocationPositionError(error)) {
    if (error.code === error.PERMISSION_DENIED) {
      return usandoIphone || usandoNavegadorInterno
        ? "A localização foi bloqueada. No iPhone, abra no Safari ou cole um link do Apple Maps/Google Maps."
        : "A localização foi bloqueada pelo navegador. Permita o acesso ou cole um link de mapa."
    }

    if (error.code === error.TIMEOUT) {
      return "A localização demorou demais. Tente novamente ou cole um link do Apple Maps/Google Maps."
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
      return "Não foi possível determinar sua localização. Cole um link do Apple Maps/Google Maps."
    }
  }

  return "Não foi possível obter sua localização. Você pode colar um link do Apple Maps/Google Maps."
}

function getCurrentPosition(options?: PositionOptions): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      reject,
      options
    )
  })
}

async function getBestEffortCurrentPosition() {
  try {
    return await getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 6500,
      maximumAge: 300000,
    })
  } catch (error) {
    if (isGeolocationPositionError(error) && error.code === error.PERMISSION_DENIED) {
      throw error
    }

    return getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    })
  }
}

function criarLocalizacaoSalva(
  coordenadas: Coordenadas,
  origem: LocalizacaoSalva["origem"],
  link?: string
) {
  return {
    coordenadas,
    link: link ?? criarLinkGoogleMaps(coordenadas),
    origem,
    atualizadaEm: new Date().toISOString(),
  } satisfies LocalizacaoSalva
}

function formatarPagamento(pagamento: PagamentoPedido) {
  switch (pagamento.metodo) {
    case "pix":
      return "Pix"
    case "cartao":
      return "Cartão"
    case "dinheiro":
      return "Dinheiro"
    default:
      return "Pagamento"
  }
}

function parseCurrencyValue(value: string) {
  const normalized = value.replace(",", ".").trim()
  if (!normalized) return null

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function formatarHorarioCurto(value: string) {
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return null

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data)
}

function formatarDataHoraPedido(value = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}

export function CartDrawer() {
  const hidratado = useCarrinho((state) => state.hidratado)
  const itens = useCarrinho((state) => state.itens)
  const localizacaoFixa = useCarrinho((state) => state.localizacaoFixa)
  const cupomEntrega = useCarrinho((state) => state.cupomEntrega)
  const removerItem = useCarrinho((state) => state.removerItem)
  const limparCarrinho = useCarrinho((state) => state.limparCarrinho)
  const salvarLocalizacao = useCarrinho((state) => state.salvarLocalizacao)
  const limparLocalizacao = useCarrinho((state) => state.limparLocalizacao)
  const removerCupomEntrega = useCarrinho((state) => state.removerCupomEntrega)
  const { sessionId, trackEvent } = useAnalytics()

  const [aberto, setAberto] = useState(false)
  const [linkAlternativo, setLinkAlternativo] = useState("")
  const [geoLoading, setGeoLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [permissaoLocalizacao, setPermissaoLocalizacao] =
    useState<EstadoPermissao>("unknown")
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("pix")
  const [precisaTroco, setPrecisaTroco] = useState<boolean | null>(null)
  const [valorEmDinheiro, setValorEmDinheiro] = useState("")
  const [locationErrorHint, setLocationErrorHint] = useState<string | null>(null)
  const [ambienteLocalizacao, setAmbienteLocalizacao] = useState({
    ios: false,
    inApp: false,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    setAmbienteLocalizacao({
      ios: isAppleMobileDevice(),
      inApp: isInAppBrowser(),
    })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setPermissaoLocalizacao("unsupported")
      return
    }

    if (!("permissions" in navigator) || typeof navigator.permissions.query !== "function") {
      setPermissaoLocalizacao("unknown")
      return
    }

    let ativo = true
    let statusAtual: PermissionStatus | null = null

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!ativo) return
        statusAtual = status
        setPermissaoLocalizacao(status.state)
        status.onchange = () => setPermissaoLocalizacao(status.state)
      })
      .catch(() => {
        if (ativo) setPermissaoLocalizacao("unknown")
      })

    return () => {
      ativo = false
      if (statusAtual) {
        statusAtual.onchange = null
      }
    }
  }, [])

  useEffect(() => {
    if (metodoPagamento !== "dinheiro") {
      setPrecisaTroco(null)
      setValorEmDinheiro("")
    }
  }, [metodoPagamento])

  const grupos = useMemo(() => agruparItens(itens), [itens])
  const subtotal = useMemo(
    () => grupos.reduce((totalGrupo, grupo) => totalGrupo + grupo.precoUnitario * grupo.quantidade, 0),
    [grupos]
  )

  const coordenadasAlternativas = useMemo(
    () => extrairCoordenadasDoLink(linkAlternativo),
    [linkAlternativo]
  )
  const linkAlternativoInvalido = Boolean(linkAlternativo.trim()) && !coordenadasAlternativas

  const localizacaoAtiva = useMemo<LocalizacaoSalva | null>(() => {
    if (coordenadasAlternativas && linkAlternativo.trim()) {
      return criarLocalizacaoSalva(coordenadasAlternativas, "manual", linkAlternativo.trim())
    }

    return localizacaoFixa
  }, [coordenadasAlternativas, linkAlternativo, localizacaoFixa])

  const entrega = useMemo(
    () => (localizacaoAtiva ? calcularPrecoEntrega(localizacaoAtiva.coordenadas) : null),
    [localizacaoAtiva]
  )
  const entregaComCupom = useMemo(
    () =>
      calcularEntregaComCupom({
        subtotal,
        originalDeliveryFee: entrega?.preco,
        cupomEntrega,
      }),
    [cupomEntrega, entrega?.preco, subtotal]
  )
  const total = subtotal + entregaComCupom.taxaFinal
  const resumoItens = `${itens.length} ${itens.length === 1 ? "item" : "itens"}`

  const valorEmDinheiroNumero = useMemo(
    () => parseCurrencyValue(valorEmDinheiro),
    [valorEmDinheiro]
  )
  const trocoCalculado =
    metodoPagamento === "dinheiro" &&
    precisaTroco === true &&
    valorEmDinheiroNumero &&
    valorEmDinheiroNumero > total
      ? Number((valorEmDinheiroNumero - total).toFixed(2))
      : null

  const trocoInvalido =
    metodoPagamento === "dinheiro" &&
    precisaTroco === true &&
    (valorEmDinheiroNumero === null || valorEmDinheiroNumero <= total)

  const mostrarAjudaLocalizacao =
    ambienteLocalizacao.ios ||
    ambienteLocalizacao.inApp ||
    Boolean(locationErrorHint) ||
    permissaoLocalizacao === "unknown" ||
    permissaoLocalizacao === "denied"

  const descricaoAjudaLocalizacao =
    locationErrorHint ??
    (ambienteLocalizacao.ios
      ? "No iPhone, a permissão pode aparecer só depois do toque. Se não abrir, use Safari ou cole um link do app Mapas."
      : ambienteLocalizacao.inApp
        ? "Navegadores internos de Instagram/Facebook podem falhar ao pedir localização. Se acontecer, cole um link de mapa."
        : "Aceita links do Apple Maps, Google Maps e coordenadas no formato -12.123456, -38.123456.")

  const localizacaoGpsSalva = localizacaoFixa?.origem === "gps" ? localizacaoFixa : null
  const localizacaoManualSalva = localizacaoFixa?.origem === "manual" ? localizacaoFixa : null
  const horarioLocalizacaoSalva = localizacaoFixa
    ? formatarHorarioCurto(localizacaoFixa.atualizadaEm)
    : null
  const rotuloAcaoLocalizacao =
    permissaoLocalizacao === "denied"
      ? "Tentar ativar novamente"
      : localizacaoGpsSalva
        ? "Atualizar minha localização"
        : "Ativar minha localização"

  async function solicitarLocalizacaoAtual(options?: { silenceErrors?: boolean }) {
    if (typeof window === "undefined") return null
    const silenceErrors = options?.silenceErrors ?? false

    if (!("geolocation" in navigator)) {
      const mensagem =
        "Seu navegador não oferece localização automática. Cole um link do Apple Maps ou Google Maps."
      setLocationErrorHint(mensagem)
      if (!silenceErrors) {
        toast.error(mensagem)
      }
      return null
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      const mensagem =
        "A localização automática precisa de HTTPS. Se preferir, cole um link do Apple Maps ou Google Maps."
      setLocationErrorHint(mensagem)
      if (!silenceErrors) {
        toast.error(mensagem)
      }
      return null
    }

    setGeoLoading(true)
    setLocationErrorHint(null)

    try {
      const coordenadas = await getBestEffortCurrentPosition()
      return criarLocalizacaoSalva(coordenadas, "gps")
    } catch (error) {
      const mensagem = getLocationErrorMessage(error)
      setLocationErrorHint(mensagem)
      if (!silenceErrors) {
        toast.error(mensagem)
      }
      return null
    } finally {
      setGeoLoading(false)
    }
  }

  async function salvarLocalizacaoAtual() {
    const localizacao = await solicitarLocalizacaoAtual()
    if (!localizacao) return

    salvarLocalizacao(localizacao)
    setLocationErrorHint(null)
    setLinkAlternativo("")
    void trackEvent({
      type: "location_saved",
      metadata: {
        origin: "gps",
      },
    })
    toast.success("Localização fixa salva para os próximos pedidos.")
  }

  function salvarLinkComoFixo() {
    if (!coordenadasAlternativas || !linkAlternativo.trim()) {
      toast.error("Cole um link válido do Apple Maps, Google Maps ou coordenadas antes de salvar.")
      return
    }

    salvarLocalizacao(
      criarLocalizacaoSalva(coordenadasAlternativas, "manual", linkAlternativo.trim())
    )
    setLocationErrorHint(null)
    setLinkAlternativo("")
    void trackEvent({
      type: "location_saved",
      metadata: {
        origin: "manual",
      },
    })
    toast.success("Link salvo como localização fixa.")
  }

  function construirPagamento(totalAtual: number): PagamentoPedido | null {
    if (metodoPagamento !== "dinheiro") {
      return { metodo: metodoPagamento }
    }

    if (precisaTroco === null) {
      toast.error("Confirme se o pagamento em dinheiro precisa de troco.")
      return null
    }

    if (precisaTroco && (valorEmDinheiroNumero === null || valorEmDinheiroNumero <= totalAtual)) {
      toast.error("Informe uma nota maior que o total para calcular o troco.")
      return null
    }

    return {
      metodo: "dinheiro",
      precisaTroco,
      valorEntregue: precisaTroco ? valorEmDinheiroNumero : null,
      trocoCalculado: precisaTroco ? trocoCalculado : null,
    }
  }

  async function obterLocalizacaoParaEnvio() {
    if (linkAlternativoInvalido) {
      toast.message("Não consegui usar esse link. Vou enviar o pedido sem localização fixa.")
      return null
    }

    if (coordenadasAlternativas && linkAlternativo.trim()) {
      return criarLocalizacaoSalva(coordenadasAlternativas, "manual", linkAlternativo.trim())
    }

    const temLocalizacaoSalva = Boolean(localizacaoFixa)
    const deveAtualizarGpsAoEnviar =
      !localizacaoManualSalva &&
      permissaoLocalizacao !== "denied" &&
      permissaoLocalizacao !== "unsupported"

    if (deveAtualizarGpsAoEnviar) {
      const localizacaoAtualizada = await solicitarLocalizacaoAtual({
        silenceErrors: true,
      })

      if (localizacaoAtualizada) {
        salvarLocalizacao(localizacaoAtualizada)
        if (temLocalizacaoSalva) {
          toast.success("Localização atualizada antes de enviar.")
        } else {
          toast.success("Localização anexada ao pedido.")
        }
        return localizacaoAtualizada
      }

      if (localizacaoFixa) {
        toast.message("Não consegui atualizar agora. Vou usar a localização salva.")
        return localizacaoFixa
      }

      return null
    }

    if (localizacaoFixa) {
      return localizacaoFixa
    }

    return solicitarLocalizacaoAtual({ silenceErrors: true })
  }

  async function enviarPedido() {
    if (checkoutLoading) return

    let redirecionado = false
    setCheckoutLoading(true)

    try {
      const localizacaoParaPedido = await obterLocalizacaoParaEnvio()
      const entregaAtual = localizacaoParaPedido
        ? calcularPrecoEntrega(localizacaoParaPedido.coordenadas)
        : null
      const entregaFinal = entregaAtual
        ? calcularEntregaComCupom({
            subtotal,
            originalDeliveryFee: entregaAtual.preco,
            cupomEntrega,
          })
        : null
      const totalAtual = subtotal + (entregaFinal?.taxaFinal ?? 0)
      const pagamento = construirPagamento(totalAtual)
      if (!pagamento) return

      const linhasItens = grupos.flatMap((grupo, index) => [
        `${index + 1}. ${grupo.quantidade}x ${grupo.nome}`,
        `   Detalhes: ${
          grupo.recheios.length > 0 ? grupo.recheios.join(", ") : "Sem adicionais"
        }`,
        `   Valor: ${BRL.format(grupo.precoUnitario * grupo.quantidade)}`,
      ])

      const linhasResumo = [`Subtotal: ${BRL.format(subtotal)}`]

      if (entregaFinal?.cupomAtivo) {
        linhasResumo.push(
          entregaFinal.elegivel
            ? `Cupom de entrega: ${entregaFinal.codigoCupom} aplicado (mínimo de ${BRL.format(
                DELIVERY_FREE_COUPON_MIN_SUBTOTAL
              )} atingido)`
            : `Cupom de entrega: ${entregaFinal.codigoCupom} ativo, mas o pedido ainda não atingiu ${BRL.format(
                DELIVERY_FREE_COUPON_MIN_SUBTOTAL
              )}`
        )
      } else if (entregaComCupom.cupomAtivo) {
        linhasResumo.push(
          subtotal >= DELIVERY_FREE_COUPON_MIN_SUBTOTAL
            ? `Cupom de entrega: ${entregaComCupom.codigoCupom} ativo. A confirmação final depende da localização fixa.`
            : `Cupom de entrega: ${entregaComCupom.codigoCupom} ativo, mas o pedido ainda não atingiu ${BRL.format(
                DELIVERY_FREE_COUPON_MIN_SUBTOTAL
              )}`
        )
      }

      if (entregaAtual && entregaFinal?.elegivel) {
        linhasResumo.push(
          `Entrega original: ${BRL.format(entregaFinal.taxaOriginal ?? entregaAtual.preco)} (${entregaAtual.distanciaKm.toFixed(2)} km)`,
          `Desconto na entrega: -${BRL.format(entregaFinal.desconto)}`,
          "Entrega final: Grátis"
        )
      } else if (entregaAtual && entregaFinal) {
        linhasResumo.push(
          `Entrega: ${BRL.format(entregaFinal.taxaFinal)} (${entregaAtual.distanciaKm.toFixed(2)} km)`
        )
        if (entregaFinal.cupomAtivo && entregaFinal.faltaParaMinimo > 0) {
          linhasResumo.push(
            `Falta para entrega grátis: ${BRL.format(entregaFinal.faltaParaMinimo)}`
          )
        }
      } else {
        linhasResumo.push("Entrega: a confirmar após a localização fixa")
      }

      linhasResumo.push(
        `${localizacaoParaPedido ? "Total" : "Total parcial"}: ${BRL.format(totalAtual)}`
      )

      const linhasPagamento = [`Método: ${formatarPagamento(pagamento)}`]

      if (pagamento.metodo === "dinheiro") {
        linhasPagamento.push(`Precisa de troco: ${pagamento.precisaTroco ? "Sim" : "Não"}`)
        if (pagamento.precisaTroco && pagamento.valorEntregue) {
          linhasPagamento.push(`Troco para: ${BRL.format(pagamento.valorEntregue)}`)
        }
        if (pagamento.precisaTroco && pagamento.trocoCalculado) {
          linhasPagamento.push(
            `${
              localizacaoParaPedido ? "Troco estimado" : "Troco estimado sobre o subtotal"
            }: ${BRL.format(pagamento.trocoCalculado)}`
          )
        }
      }

      const linhasEntrega = localizacaoParaPedido
        ? [
            "Localização fixa recebida.",
            `Link do mapa: ${localizacaoParaPedido.link}`,
            `Coordenadas: ${formatarCoordenadas(localizacaoParaPedido.coordenadas)}`,
            `Observações: ${MENSAGEM_COM_LOCALIZACAO}`,
          ]
        : ["Localização fixa pendente.", `Observações: ${MENSAGEM_SEM_LOCALIZACAO}`]

      const linhas = [
        "*NOVO PEDIDO*",
        `Data: ${formatarDataHoraPedido()}`,
        "",
        "*ITENS*",
        ...linhasItens,
        "",
        "*RESUMO*",
        ...linhasResumo,
        "",
        "*PAGAMENTO*",
        ...linhasPagamento,
        "",
        "*ENTREGA*",
        ...linhasEntrega,
      ]

      postJsonInBackground("/api/leads", {
        sessionId,
        subtotal,
        deliveryFee: entregaFinal?.taxaFinal ?? 0,
        originalDeliveryFee: entregaFinal?.taxaOriginal ?? entregaAtual?.preco ?? null,
        total: totalAtual,
        whatsappNumber: WHATSAPP_NUMBER,
        locationUrl: localizacaoParaPedido?.link ?? null,
        latitude: localizacaoParaPedido?.coordenadas.lat ?? null,
        longitude: localizacaoParaPedido?.coordenadas.lng ?? null,
        paymentMethod: pagamento.metodo,
        needsChange:
          pagamento.metodo === "dinheiro" ? pagamento.precisaTroco ?? null : null,
        cashTendered:
          pagamento.metodo === "dinheiro" ? pagamento.valorEntregue ?? null : null,
        changeAmount:
          pagamento.metodo === "dinheiro" ? pagamento.trocoCalculado ?? null : null,
        couponCode: entregaFinal?.codigoCupom ?? entregaComCupom.codigoCupom,
        couponDiscount: entregaFinal?.desconto || null,
        couponMinimumSubtotal: (entregaFinal?.cupomAtivo ?? entregaComCupom.cupomAtivo)
          ? DELIVERY_FREE_COUPON_MIN_SUBTOTAL
          : null,
        couponEligible: entregaFinal?.cupomAtivo ? entregaFinal.elegivel : null,
        deliveryPendingQuote: localizacaoParaPedido ? null : true,
        items: grupos.map((grupo) => ({
          productId: grupo.productId,
          productName: grupo.nome,
          quantity: grupo.quantidade,
          unitPrice: grupo.precoUnitario,
          fillings: grupo.recheios,
        })),
      })

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(linhas.join("\n"))}`

      void trackEvent({
        type: "whatsapp_checkout_clicked",
        value: totalAtual,
        metadata: {
          items: grupos.length,
          paymentMethod: pagamento.metodo,
          deliveryDistanceKm: entregaAtual?.distanciaKm ?? null,
          deliveryCouponCode: entregaFinal?.codigoCupom ?? entregaComCupom.codigoCupom,
          deliveryDiscount: entregaFinal?.desconto ?? null,
          deliveryPendingQuote: localizacaoParaPedido ? null : true,
        },
      })

      reportMetaInitiateCheckout({
        value: totalAtual,
        currency: "BRL",
        paymentMethod: pagamento.metodo,
        items: grupos.map((grupo) => ({
          id: grupo.productId,
          quantity: grupo.quantidade,
          itemPrice: grupo.precoUnitario,
        })),
      })

      reportMetaLead({
        value: totalAtual,
        currency: "BRL",
        paymentMethod: pagamento.metodo,
        items: grupos.map((grupo) => ({
          id: grupo.productId,
          quantity: grupo.quantidade,
          itemPrice: grupo.precoUnitario,
        })),
      })

      reportGoogleAdsConversion({
        value: totalAtual,
        currency: "BRL",
        transactionId: `${sessionId ?? "guest"}-${Date.now()}`,
      })

      redirecionado = true
      window.location.assign(url)
    } finally {
      if (!redirecionado) {
        setCheckoutLoading(false)
      }
    }
  }

  if (!hidratado || itens.length === 0) {
    return null
  }

  return (
    <Drawer.Root open={aberto} onOpenChange={setAberto}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 grid w-[min(390px,calc(100vw-1rem))] -translate-x-1/2 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[24px] border border-[#8d4b1a]/20 bg-[linear-gradient(135deg,rgba(183,86,24,0.98),rgba(246,187,88,0.98))] px-4 py-3 text-primary-foreground shadow-[0_20px_40px_rgba(116,50,18,0.28)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:min-w-[260px] sm:translate-x-0"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-black/12 shadow-inner shadow-black/5">
            <ShoppingBag className="size-5" />
          </span>

          <span className="min-w-0 text-left">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/78">
              Seu pedido
            </span>
            <span className="block text-sm font-semibold leading-tight">Abrir carrinho</span>
            <span className="block text-xs text-primary-foreground/78">
              {resumoItens} • {BRL.format(total)}
            </span>
          </span>

          <Badge className="justify-self-end rounded-full border-0 bg-background/92 px-2.5 py-1 text-xs font-semibold text-foreground shadow-none">
            {itens.length}
          </Badge>
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />

        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,249,238,1),rgba(254,245,225,0.96))] px-4 pb-4 pt-3 shadow-2xl sm:mx-auto sm:max-w-2xl sm:px-6 sm:pb-6">
          <Drawer.Title className="sr-only">Seu pedido</Drawer.Title>

          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/75">
                Pedido
              </p>
              <h2 className="text-2xl font-semibold text-foreground">Seu carrinho</h2>
            </div>

            <button
              type="button"
              onClick={() => setAberto(false)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Fechar carrinho"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto pb-4">
            <section className="rounded-[28px] border border-border bg-card/80 p-4 shadow-[0_14px_30px_rgba(95,42,15,0.05)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Itens do pedido</h3>
                  <p className="text-sm text-muted-foreground">
                    Remova uma unidade por vez, se precisar.
                  </p>
                </div>
                <Badge variant="outline">{grupos.length} grupos</Badge>
              </div>

              <ul className="space-y-3">
                {grupos.map((grupo) => {
                  const indiceParaRemover = grupo.indices[grupo.indices.length - 1]

                  return (
                    <li
                      key={grupo.chave}
                      className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-3xl border border-border bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {grupo.quantidade}x {grupo.nome}
                        </div>
                        <p className="text-sm text-muted-foreground">{grupo.descricao}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {BRL.format(grupo.precoUnitario * grupo.quantidade)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItem(indiceParaRemover)}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remover uma unidade de ${grupo.nome}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="rounded-[28px] border border-border bg-card/85 p-4 shadow-[0_14px_30px_rgba(95,42,15,0.05)]">
              <div className="mb-3">
                <h3 className="font-semibold text-foreground">Pagamento</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha como vai pagar. Em dinheiro, a confirmação de troco é obrigatória.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {paymentOptions.map((option) => {
                  const Icon = option.icon
                  const active = metodoPagamento === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setMetodoPagamento(option.id)}
                      className={cn(
                        "rounded-[24px] border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-primary/35 bg-primary/10 shadow-[0_12px_28px_rgba(117,54,20,0.08)]"
                          : "border-border bg-background hover:bg-accent"
                      )}
                    >
                      <div className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                        <Icon className="size-4" />
                      </div>
                      <div className="font-medium text-foreground">{option.label}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </div>
                    </button>
                  )
                })}
              </div>

              {metodoPagamento === "dinheiro" ? (
                <div className="mt-4 space-y-3 rounded-[24px] border border-border bg-background/80 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Precisa de troco?</p>
                    <p className="text-xs text-muted-foreground">
                      Essa confirmação é obrigatória para pagamento em dinheiro.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPrecisaTroco(false)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm transition-colors",
                        precisaTroco === false
                          ? "border-primary/35 bg-primary/10 text-foreground"
                          : "border-border bg-background hover:bg-accent"
                      )}
                    >
                      Não preciso de troco
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrecisaTroco(true)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm transition-colors",
                        precisaTroco === true
                          ? "border-primary/35 bg-primary/10 text-foreground"
                          : "border-border bg-background hover:bg-accent"
                      )}
                    >
                      Sim, preciso de troco
                    </button>
                  </div>

                  {precisaTroco === true ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Nota/valor com que vai pagar
                      </label>
                      <Input
                        value={valorEmDinheiro}
                        onChange={(event) => setValorEmDinheiro(event.target.value)}
                        type="number"
                        min={total}
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Ex.: 50"
                        invalid={trocoInvalido}
                      />
                      {trocoInvalido ? (
                        <p className="text-sm text-destructive">
                          Informe um valor maior que o {entrega ? "total" : "subtotal"} para calcular o troco.
                        </p>
                      ) : trocoCalculado !== null ? (
                        <p className="text-sm text-muted-foreground">
                          {entrega ? "Troco estimado" : "Troco estimado sobre o subtotal"}:{" "}
                          <span className="font-semibold text-foreground">
                            {BRL.format(trocoCalculado)}
                          </span>
                        </p>
                      ) : null}
                      {!entrega ? (
                        <p className="text-sm text-muted-foreground">
                          A taxa de entrega será confirmada depois que a localização fixa for enviada no WhatsApp.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            {false ? (
              <section className="rounded-[28px] border border-border bg-card/85 p-4 shadow-[0_14px_30px_rgba(95,42,15,0.05)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Cupom de entrega</h3>
                  <p className="text-sm text-muted-foreground">
                    Entrega grátis com subtotal mínimo de {BRL.format(DELIVERY_FREE_COUPON_MIN_SUBTOTAL)}.
                  </p>
                </div>
                <Badge variant={entregaComCupom.cupomAtivo ? "success" : "outline"}>
                  {entregaComCupom.cupomAtivo ? cupomEntrega?.codigo : "Inativo"}
                </Badge>
              </div>

              {entregaComCupom.cupomAtivo ? (
                <div className="space-y-3 rounded-[24px] border border-border bg-background/80 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {entregaComCupom.elegivel
                        ? "Subtotal elegível. A taxa de entrega será zerada neste pedido."
                        : `Faltam ${BRL.format(entregaComCupom.faltaParaMinimo)} para liberar a entrega grátis.`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Se o subtotal cair abaixo de {BRL.format(DELIVERY_FREE_COUPON_MIN_SUBTOTAL)}, a
                      entrega volta a ser cobrada normalmente.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-3xl border border-border bg-card px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-foreground">Aplicado via link</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Regra</span>
                      <span className="font-medium text-foreground">
                        A partir de {BRL.format(DELIVERY_FREE_COUPON_MIN_SUBTOTAL)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Subtotal atual</span>
                      <span className="font-medium text-foreground">{BRL.format(subtotal)}</span>
                    </div>
                    {entrega ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Taxa antes do cupom</span>
                        <span className="font-medium text-foreground">
                          {BRL.format(entregaComCupom.taxaOriginal ?? entrega?.preco ?? 0)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <Button variant="ghost" onClick={removerCupomEntrega} className="rounded-2xl">
                    Remover cupom
                  </Button>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border bg-background/75 p-4 text-sm text-muted-foreground">
                  Abra o link promocional para aplicar automaticamente o cupom de entrega grátis.
                </div>
              )}
              </section>
            ) : null}

            <section className="rounded-[28px] border border-border bg-card/85 p-4 shadow-[0_14px_30px_rgba(95,42,15,0.05)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Localização do pedido</h3>
                  <p className="text-sm text-muted-foreground">
                    Ative sua localização para calcular a entrega com mais precisão. No envio, tentamos atualizar novamente automaticamente, mas o pedido também pode seguir sem localização.
                  </p>
                </div>
                <Badge variant="outline">{getLocationStatusLabel(permissaoLocalizacao)}</Badge>
              </div>

              {mostrarAjudaLocalizacao ? (
                <div className="mb-4 rounded-[24px] border border-[#e9c78a] bg-[linear-gradient(180deg,rgba(255,248,231,0.9),rgba(255,241,208,0.9))] px-4 py-3 text-sm text-foreground/82">
                  <p className="font-medium text-foreground">{descricaoAjudaLocalizacao}</p>
                  <p className="mt-1 text-muted-foreground">
                    {ambienteLocalizacao.ios
                      ? "Se a permissão não abrir aqui, prefira Safari. Links do app Mapas também funcionam."
                      : "Você também pode colar coordenadas no formato -12.123456, -38.123456."}
                  </p>
                </div>
              ) : null}

              <div className="mb-4 rounded-[24px] border border-border bg-background/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Ativação automática</p>
                    <p className="text-sm text-muted-foreground">
                      Toque para permitir o GPS. Se já estiver ativo, atualizamos sua posição agora e também antes de enviar. Se preferir, você pode mandar o pedido sem essa etapa.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    loading={geoLoading}
                    onClick={salvarLocalizacaoAtual}
                    className="rounded-2xl sm:min-w-[220px]"
                  >
                    {geoLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    {rotuloAcaoLocalizacao}
                  </Button>
                </div>
              </div>

              {localizacaoFixa ? (
                <div className="mb-4 rounded-3xl border border-border bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">
                        {localizacaoGpsSalva ? "Localização automática salva" : "Localização fixa salva"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatarCoordenadas(localizacaoFixa.coordenadas)}
                      </div>
                      {horarioLocalizacaoSalva ? (
                        <div className="text-xs text-muted-foreground">
                          Atualizada às {horarioLocalizacaoSalva}
                        </div>
                      ) : null}
                    </div>
                    <Badge variant="secondary">
                      {localizacaoFixa.origem === "gps" ? "GPS" : "Link"}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Ou informe manualmente</p>
                  <p className="text-sm text-muted-foreground">
                    Cole um link de mapa caso prefira revisar o endereço sem usar o GPS. Se não informar agora, você ainda poderá enviar o pedido.
                  </p>
                </div>

                <Textarea
                  value={linkAlternativo}
                  onChange={(event) => setLinkAlternativo(event.target.value)}
                  placeholder="Cole um link do Apple Maps, Google Maps ou as coordenadas para usar outra localização."
                  resize="y"
                  invalid={linkAlternativoInvalido}
                  rows={4}
                />

                {linkAlternativoInvalido ? (
                  <p className="text-sm text-destructive">
                    Não consegui ler as coordenadas desse link. Cole um link do Apple Maps, Google Maps ou as coordenadas.
                  </p>
                ) : null}

                <Button
                  variant="secondary"
                  fullWidth
                  onClick={salvarLinkComoFixo}
                  disabled={!coordenadasAlternativas}
                  className="rounded-2xl"
                >
                  Salvar link como fixo
                </Button>

                {localizacaoFixa ? (
                  <Button variant="ghost" onClick={limparLocalizacao} className="rounded-2xl">
                    Remover localização fixa
                  </Button>
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-card/85 p-4 shadow-[0_14px_30px_rgba(95,42,15,0.05)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">Resumo</h3>
                {entrega ? (
                  <Badge variant="secondary">{entrega.distanciaKm.toFixed(2)} km</Badge>
                ) : (
                  <Badge variant="outline">Entrega a confirmar</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{BRL.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {entregaComCupom.cupomAtivo ? "Entrega original" : "Entrega"}
                  </span>
                  <span className="font-medium text-foreground">
                    {entrega
                      ? BRL.format(entregaComCupom.taxaOriginal ?? entrega.preco)
                      : "A confirmar após localização"}
                  </span>
                </div>
                {entregaComCupom.cupomAtivo ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cupom de entrega</span>
                    <span className="font-medium text-foreground">
                      {entrega
                        ? entregaComCupom.elegivel
                          ? `-${BRL.format(entregaComCupom.desconto)}`
                          : `Faltam ${BRL.format(entregaComCupom.faltaParaMinimo)}`
                        : subtotal >= DELIVERY_FREE_COUPON_MIN_SUBTOTAL
                          ? "Ativo, falta confirmar"
                          : `Faltam ${BRL.format(entregaComCupom.faltaParaMinimo)}`}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entrega final</span>
                  <span className="font-medium text-foreground">
                    {entrega && entregaComCupom.elegivel
                      ? "Grátis"
                      : entrega
                        ? BRL.format(entregaComCupom.taxaFinal)
                        : "A confirmar no WhatsApp"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="font-medium text-foreground">
                    {formatarPagamento({ metodo: metodoPagamento })}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                  <span className="font-semibold text-foreground">
                    {entrega ? "Total" : "Total parcial"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {BRL.format(entrega ? total : subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-border bg-background/80 p-4 text-sm">
                <p className="font-medium text-foreground">
                  {entrega ? "Antes de enviar" : "Se preferir enviar sem localização"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {entrega ? MENSAGEM_COM_LOCALIZACAO : MENSAGEM_SEM_LOCALIZACAO}
                </p>
              </div>
            </section>
          </div>

          <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_auto_auto]">
            <Button fullWidth onClick={enviarPedido} loading={checkoutLoading} className="rounded-2xl">
              {checkoutLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {checkoutLoading ? "Abrindo WhatsApp..." : "Enviar pedido no WhatsApp"}
            </Button>
            <Button variant="outline" onClick={limparCarrinho} className="rounded-2xl">
              Limpar
            </Button>
            <Button variant="ghost" onClick={() => setAberto(false)} className="rounded-2xl">
              Fechar
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
