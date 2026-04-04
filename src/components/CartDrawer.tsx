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
import { useCarrinho } from "@/hooks/useCarrinho"
import { reportGoogleAdsConversion } from "@/lib/googleAds"
import { cn } from "@/lib/utils"
import {
  criarLinkGoogleMaps,
  extrairCoordenadasDoLink,
  formatarCoordenadas,
} from "@/lib/maps"
import { WHATSAPP_NUMBER } from "@/lib/site"
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

type EstadoPermissao = PermissionState | "unsupported"

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

function descreverGrupo(nome: string, recheios: string[]) {
  if (recheios.length === 0) return `${nome} sem adicionais`
  return `${nome} com ${recheios.join(", ")}`
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

export function CartDrawer() {
  const hidratado = useCarrinho((state) => state.hidratado)
  const itens = useCarrinho((state) => state.itens)
  const localizacaoFixa = useCarrinho((state) => state.localizacaoFixa)
  const removerItem = useCarrinho((state) => state.removerItem)
  const limparCarrinho = useCarrinho((state) => state.limparCarrinho)
  const salvarLocalizacao = useCarrinho((state) => state.salvarLocalizacao)
  const limparLocalizacao = useCarrinho((state) => state.limparLocalizacao)
  const { sessionId, trackEvent } = useAnalytics()

  const [aberto, setAberto] = useState(false)
  const [linkAlternativo, setLinkAlternativo] = useState("")
  const [geoLoading, setGeoLoading] = useState(false)
  const [permissaoLocalizacao, setPermissaoLocalizacao] =
    useState<EstadoPermissao>("unsupported")
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("pix")
  const [precisaTroco, setPrecisaTroco] = useState<boolean | null>(null)
  const [valorEmDinheiro, setValorEmDinheiro] = useState("")

  useEffect(() => {
    if (typeof window === "undefined" || !("permissions" in navigator)) {
      setPermissaoLocalizacao("unsupported")
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
        if (ativo) setPermissaoLocalizacao("unsupported")
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
    () => grupos.reduce((total, grupo) => total + grupo.precoUnitario * grupo.quantidade, 0),
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
  const total = subtotal + (entrega?.preco ?? 0)
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

  async function solicitarLocalizacaoAtual() {
    if (typeof window === "undefined") return null

    if (!("geolocation" in navigator)) {
      toast.error("Seu navegador não suporta geolocalização.")
      return null
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      toast.error("A geolocalização precisa de HTTPS para funcionar fora do localhost.")
      return null
    }

    setGeoLoading(true)

    try {
      const coordenadas = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      })

      return criarLocalizacaoSalva(coordenadas, "gps")
    } catch {
      toast.error("Não foi possível obter sua localização.")
      return null
    } finally {
      setGeoLoading(false)
    }
  }

  async function salvarLocalizacaoAtual() {
    const localizacao = await solicitarLocalizacaoAtual()
    if (!localizacao) return

    salvarLocalizacao(localizacao)
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
      toast.error("Cole um link válido do Google Maps antes de salvar.")
      return
    }

    salvarLocalizacao(
      criarLocalizacaoSalva(coordenadasAlternativas, "manual", linkAlternativo.trim())
    )
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

  async function enviarPedido() {
    if (linkAlternativoInvalido) {
      toast.error("Cole um link válido do Google Maps ou use sua localização fixa.")
      return
    }

    let localizacaoParaPedido = localizacaoAtiva

    if (!localizacaoParaPedido) {
      localizacaoParaPedido = await solicitarLocalizacaoAtual()
      if (!localizacaoParaPedido) return

      salvarLocalizacao(localizacaoParaPedido)
      toast.success("Permissão concedida. A localização foi anexada ao pedido.")
    }

    const entregaAtual = calcularPrecoEntrega(localizacaoParaPedido.coordenadas)
    const totalAtual = subtotal + entregaAtual.preco
    const pagamento = construirPagamento(totalAtual)
    if (!pagamento) return

    const linhas = [
      "Olá! Gostaria de fazer um pedido:",
      "",
      ...grupos.map(
        (grupo) =>
          `- ${grupo.quantidade}x ${descreverGrupo(grupo.nome, grupo.recheios)} (${BRL.format(
            grupo.precoUnitario * grupo.quantidade
          )})`
      ),
      "",
      `Subtotal: ${BRL.format(subtotal)}`,
      `Entrega: ${BRL.format(entregaAtual.preco)} (${entregaAtual.distanciaKm.toFixed(2)} km)`,
      `Total: ${BRL.format(totalAtual)}`,
      `Pagamento: ${formatarPagamento(pagamento)}`,
    ]

    if (pagamento.metodo === "dinheiro") {
      linhas.push(`Precisa de troco: ${pagamento.precisaTroco ? "Sim" : "Não"}`)
      if (pagamento.precisaTroco && pagamento.valorEntregue) {
        linhas.push(`Troco para: ${BRL.format(pagamento.valorEntregue)}`)
      }
      if (pagamento.precisaTroco && pagamento.trocoCalculado) {
        linhas.push(`Troco estimado: ${BRL.format(pagamento.trocoCalculado)}`)
      }
    }

    linhas.push(
      "",
      `Localização: ${localizacaoParaPedido.link}`,
      `Coordenadas: ${formatarCoordenadas(localizacaoParaPedido.coordenadas)}`
    )

    await fetch("/api/leads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        subtotal,
        deliveryFee: entregaAtual.preco,
        total: totalAtual,
        whatsappNumber: WHATSAPP_NUMBER,
        locationUrl: localizacaoParaPedido.link,
        latitude: localizacaoParaPedido.coordenadas.lat,
        longitude: localizacaoParaPedido.coordenadas.lng,
        paymentMethod: pagamento.metodo,
        needsChange:
          pagamento.metodo === "dinheiro" ? pagamento.precisaTroco ?? null : null,
        cashTendered:
          pagamento.metodo === "dinheiro" ? pagamento.valorEntregue ?? null : null,
        changeAmount:
          pagamento.metodo === "dinheiro" ? pagamento.trocoCalculado ?? null : null,
        items: grupos.map((grupo) => ({
          productId: grupo.productId,
          productName: grupo.nome,
          quantity: grupo.quantidade,
          unitPrice: grupo.precoUnitario,
          fillings: grupo.recheios,
        })),
      }),
    }).catch(() => undefined)

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(linhas.join("\n"))}`

    void trackEvent({
      type: "whatsapp_checkout_clicked",
      value: totalAtual,
      metadata: {
        items: grupos.length,
        paymentMethod: pagamento.metodo,
        deliveryDistanceKm: entregaAtual.distanciaKm,
      },
    })

    reportGoogleAdsConversion({
      value: totalAtual,
      currency: "BRL",
      transactionId: `${sessionId ?? "guest"}-${Date.now()}`,
      onComplete: () => {
        window.location.href = url
      },
    })
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
                          Informe um valor maior que o total para calcular o troco.
                        </p>
                      ) : trocoCalculado !== null ? (
                        <p className="text-sm text-muted-foreground">
                          Troco estimado:{" "}
                          <span className="font-semibold text-foreground">
                            {BRL.format(trocoCalculado)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-border bg-card/85 p-4 shadow-[0_14px_30px_rgba(95,42,15,0.05)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Localização do pedido</h3>
                  <p className="text-sm text-muted-foreground">
                    A permissão é pedida uma vez e a localização fixa pode ser reutilizada.
                  </p>
                </div>
                <Badge variant="outline">
                  {permissaoLocalizacao === "granted"
                    ? "Permitida"
                    : permissaoLocalizacao === "denied"
                      ? "Bloqueada"
                      : permissaoLocalizacao === "prompt"
                        ? "Pendente"
                        : "Sem suporte"}
                </Badge>
              </div>

              {localizacaoFixa ? (
                <div className="mb-4 rounded-3xl border border-border bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">Localização fixa salva</div>
                      <div className="text-sm text-muted-foreground">
                        {formatarCoordenadas(localizacaoFixa.coordenadas)}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {localizacaoFixa.origem === "gps" ? "GPS" : "Link"}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <Textarea
                  value={linkAlternativo}
                  onChange={(event) => setLinkAlternativo(event.target.value)}
                  placeholder="Cole um link do Google Maps para usar outra localização neste pedido."
                  resize="y"
                  invalid={linkAlternativoInvalido}
                  rows={4}
                />

                {linkAlternativoInvalido ? (
                  <p className="text-sm text-destructive">
                    Não consegui ler as coordenadas desse link. Cole um link do Google Maps com a
                    localização.
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    fullWidth
                    loading={geoLoading}
                    onClick={salvarLocalizacaoAtual}
                    className="rounded-2xl"
                  >
                    {geoLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    Usar minha localização fixa
                  </Button>

                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={salvarLinkComoFixo}
                    disabled={!coordenadasAlternativas}
                    className="rounded-2xl"
                  >
                    Salvar link como fixo
                  </Button>
                </div>

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
                  <Badge variant="outline">Sem localização</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{BRL.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-medium text-foreground">
                    {entrega ? BRL.format(entrega.preco) : "Defina a localização"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="font-medium text-foreground">
                    {formatarPagamento({ metodo: metodoPagamento })}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-semibold text-foreground">{BRL.format(total)}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_auto_auto]">
            <Button fullWidth onClick={enviarPedido} className="rounded-2xl">
              <Send className="size-4" />
              Enviar pedido no WhatsApp
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
