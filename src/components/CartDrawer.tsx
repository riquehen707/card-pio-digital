"use client"

import { useEffect, useMemo, useState } from "react"
import { Drawer } from "vaul"
import { CheckCircle2, Loader2, MapPin, Send, TicketPercent, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAnalytics } from "@/components/AnalyticsProvider"
import { agruparItens } from "@/features/carrinho/agruparItens"
import { calcularPrecoEntrega } from "@/features/carrinho/calcularEntrega"
import { useCarrinho } from "@/hooks/useCarrinho"
import { AVAILABLE_COUPONS, evaluateCoupon, normalizeCouponCode } from "@/lib/coupons"
import {
  criarLinkGoogleMaps,
  extrairCoordenadasDoLink,
  formatarCoordenadas,
} from "@/lib/maps"
import { WHATSAPP_NUMBER } from "@/lib/site"
import type { Coordenadas, LocalizacaoSalva } from "@/types/carrinho"

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

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
  if (recheios.length === 0) return `${nome} sem recheios`
  return `${nome} com ${recheios.join(", ")}`
}

export function CartDrawer() {
  const hidratado = useCarrinho((state) => state.hidratado)
  const itens = useCarrinho((state) => state.itens)
  const localizacaoFixa = useCarrinho((state) => state.localizacaoFixa)
  const cupomSalvo = useCarrinho((state) => state.cupom)
  const removerItem = useCarrinho((state) => state.removerItem)
  const limparCarrinho = useCarrinho((state) => state.limparCarrinho)
  const salvarLocalizacao = useCarrinho((state) => state.salvarLocalizacao)
  const limparLocalizacao = useCarrinho((state) => state.limparLocalizacao)
  const aplicarCupom = useCarrinho((state) => state.aplicarCupom)
  const limparCupom = useCarrinho((state) => state.limparCupom)
  const { sessionId, trackEvent } = useAnalytics()

  const [aberto, setAberto] = useState(false)
  const [linkAlternativo, setLinkAlternativo] = useState("")
  const [cupomInput, setCupomInput] = useState("")
  const [geoLoading, setGeoLoading] = useState(false)
  const [permissaoLocalizacao, setPermissaoLocalizacao] = useState<EstadoPermissao>("unsupported")

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
    setCupomInput(cupomSalvo?.codigo ?? "")
  }, [cupomSalvo?.codigo])

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

  const avaliacaoCupom = useMemo(() => {
    if (!cupomSalvo?.codigo) return null
    return evaluateCoupon(cupomSalvo.codigo, subtotal)
  }, [cupomSalvo?.codigo, subtotal])

  const statusCupom =
    avaliacaoCupom && avaliacaoCupom.status !== "invalid" ? avaliacaoCupom : null
  const desconto = avaliacaoCupom?.status === "applied" ? avaliacaoCupom.discount : 0
  const total = Math.max(subtotal + (entrega?.preco ?? 0) - desconto, 0)

  async function solicitarLocalizacaoAtual() {
    if (typeof window === "undefined") return null

    if (!("geolocation" in navigator)) {
      toast.error("Seu navegador nao suporta geolocalizacao.")
      return null
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      toast.error("A geolocalizacao precisa de HTTPS para funcionar fora do localhost.")
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
      toast.error("Nao foi possivel obter sua localizacao.")
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
    toast.success("Localizacao fixa salva para os proximos pedidos.")
  }

  function salvarLinkComoFixo() {
    if (!coordenadasAlternativas || !linkAlternativo.trim()) {
      toast.error("Cole um link valido do Google Maps antes de salvar.")
      return
    }

    salvarLocalizacao(criarLocalizacaoSalva(coordenadasAlternativas, "manual", linkAlternativo.trim()))
    setLinkAlternativo("")
    void trackEvent({
      type: "location_saved",
      metadata: {
        origin: "manual",
      },
    })
    toast.success("Link salvo como localizacao fixa.")
  }

  function aplicarCodigoCupom(codigo = cupomInput) {
    const normalizedCode = normalizeCouponCode(codigo)

    if (!normalizedCode) {
      toast.error("Digite um cupom antes de aplicar.")
      return
    }

    const avaliacao = evaluateCoupon(normalizedCode, subtotal)

    if (avaliacao.status === "invalid" || avaliacao.status === "ineligible") {
      toast.error(avaliacao.message)
      return
    }

    aplicarCupom({ codigo: avaliacao.normalizedCode })
    setCupomInput(avaliacao.normalizedCode)
    void trackEvent({
      type: "coupon_applied",
      value: avaliacao.discount,
      metadata: {
        code: avaliacao.normalizedCode,
      },
    })
    toast.success(avaliacao.message)
  }

  function removerCupomAplicado() {
    limparCupom()
    setCupomInput("")
    toast.success("Cupom removido do pedido.")
  }

  async function enviarPedido() {
    if (linkAlternativoInvalido) {
      toast.error("Cole um link valido do Google Maps ou use sua localizacao fixa.")
      return
    }

    let localizacaoParaPedido = localizacaoAtiva

    if (!localizacaoParaPedido) {
      localizacaoParaPedido = await solicitarLocalizacaoAtual()
      if (!localizacaoParaPedido) return

      salvarLocalizacao(localizacaoParaPedido)
      toast.success("Permissao concedida. A localizacao foi anexada ao pedido.")
    }

    const entregaAtual = calcularPrecoEntrega(localizacaoParaPedido.coordenadas)
    const avaliacaoCupomAtual =
      cupomSalvo?.codigo ? evaluateCoupon(cupomSalvo.codigo, subtotal) : null
    const descontoAtual = avaliacaoCupomAtual?.status === "applied" ? avaliacaoCupomAtual.discount : 0
    const totalAtual = Math.max(subtotal + entregaAtual.preco - descontoAtual, 0)

    const linhas = [
      "Ola! Gostaria de fazer um pedido:",
      "",
      ...grupos.map(
        (grupo) =>
          `- ${grupo.quantidade}x ${descreverGrupo(grupo.nome, grupo.recheios)} (${BRL.format(
            grupo.precoUnitario * grupo.quantidade
          )})`
      ),
      "",
      `Subtotal: ${BRL.format(subtotal)}`,
      ...(descontoAtual > 0 && avaliacaoCupomAtual?.status === "applied"
        ? [
            `Cupom ${avaliacaoCupomAtual.coupon.code} (${avaliacaoCupomAtual.coupon.label}): -${BRL.format(
              descontoAtual
            )}`,
          ]
        : []),
      `Entrega: ${BRL.format(entregaAtual.preco)}`,
      `Total: ${BRL.format(totalAtual)}`,
      "",
      `Localizacao: ${localizacaoParaPedido.link}`,
      `Coordenadas: ${formatarCoordenadas(localizacaoParaPedido.coordenadas)}`,
    ]

    await fetch("/api/leads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        subtotal,
        discountAmount: descontoAtual,
        couponCode:
          avaliacaoCupomAtual?.status === "applied" ? avaliacaoCupomAtual.coupon.code : null,
        couponLabel:
          avaliacaoCupomAtual?.status === "applied" ? avaliacaoCupomAtual.coupon.label : null,
        deliveryFee: entregaAtual.preco,
        total: totalAtual,
        whatsappNumber: WHATSAPP_NUMBER,
        locationUrl: localizacaoParaPedido.link,
        latitude: localizacaoParaPedido.coordenadas.lat,
        longitude: localizacaoParaPedido.coordenadas.lng,
        items: grupos.map((grupo) => ({
          productId: grupo.productId,
          productName: grupo.nome,
          quantity: grupo.quantidade,
          unitPrice: grupo.precoUnitario,
          fillings: grupo.recheios,
        })),
      }),
    }).catch(() => undefined)

    void trackEvent({
      type: "whatsapp_checkout_clicked",
      value: totalAtual,
      metadata: {
        items: grupos.length,
        couponCode:
          avaliacaoCupomAtual?.status === "applied" ? avaliacaoCupomAtual.coupon.code : null,
      },
    })

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(linhas.join("\n"))}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (!hidratado || itens.length === 0) {
    return null
  }

  return (
    <Drawer.Root open={aberto} onOpenChange={setAberto}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--primary),rgba(246,187,88,1))] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span>Carrinho</span>
          <Badge variant="secondary">{itens.length}</Badge>
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />

        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,249,238,1),rgba(254,245,225,0.96))] px-4 pb-4 pt-3 shadow-2xl sm:mx-auto sm:max-w-2xl sm:px-6 sm:pb-6">
          <Drawer.Title className="sr-only">Seu pedido</Drawer.Title>

          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/75">Pedido</p>
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
            <section className="rounded-[28px] border border-border bg-card/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Itens do pedido</h3>
                  <p className="text-sm text-muted-foreground">Remova uma unidade por vez, se precisar.</p>
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

            <section className="rounded-[28px] border border-border bg-card/85 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Localizacao do pedido</h3>
                  <p className="text-sm text-muted-foreground">
                    A permissao e pedida uma vez e a localizacao fixa pode ser reutilizada.
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
                      <div className="font-medium text-foreground">Localizacao fixa salva</div>
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
                  placeholder="Cole um link do Google Maps para usar outra localizacao neste pedido."
                  resize="y"
                  invalid={linkAlternativoInvalido}
                  rows={4}
                />

                {linkAlternativoInvalido ? (
                  <p className="text-sm text-destructive">
                    Nao consegui ler as coordenadas desse link. Cole um link do Google Maps com a localizacao.
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
                    Usar minha localizacao fixa
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
                    Remover localizacao fixa
                  </Button>
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-card/85 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">Cupom de desconto</h3>
                  <p className="text-sm text-muted-foreground">
                    Digite um codigo promocional para abater no subtotal.
                  </p>
                </div>
                <Badge variant="secondary">
                  <TicketPercent className="size-3.5" />
                  Promo
                </Badge>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={cupomInput}
                  onChange={(event) => setCupomInput(event.target.value.toUpperCase())}
                  placeholder="Ex.: DENDE10"
                  className="bg-background/90"
                />
                <Button onClick={() => aplicarCodigoCupom()} className="rounded-2xl sm:w-auto">
                  Aplicar
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {AVAILABLE_COUPONS.map((cupom) => (
                  <button
                    key={cupom.code}
                    type="button"
                    onClick={() => aplicarCodigoCupom(cupom.code)}
                    className="inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
                  >
                    {cupom.code}
                  </button>
                ))}
              </div>

              {statusCupom ? (
                <div
                  className={`mt-4 rounded-3xl border px-4 py-3 ${
                    statusCupom.status === "applied"
                      ? "border-emerald-300/70 bg-emerald-50/80"
                      : "border-amber-300/70 bg-amber-50/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {statusCupom.status === "applied" ? (
                          <CheckCircle2 className="size-4 text-emerald-700" />
                        ) : (
                          <TicketPercent className="size-4 text-amber-700" />
                        )}
                        <span className="font-medium text-foreground">
                          {statusCupom.status === "applied"
                            ? `${statusCupom.coupon.code} ativo`
                            : `${statusCupom.coupon.code} aguardando subtotal`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{statusCupom.coupon.description}</p>
                      <p className="text-sm font-medium text-foreground">{statusCupom.message}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removerCupomAplicado}
                      className="rounded-full"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-border bg-card/85 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">Resumo</h3>
                {entrega ? (
                  <Badge variant="secondary">{entrega.distanciaKm.toFixed(2)} km</Badge>
                ) : (
                  <Badge variant="outline">Sem localizacao</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{BRL.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="font-medium text-foreground">
                    {desconto > 0 ? `-${BRL.format(desconto)}` : "Sem cupom ativo"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-medium text-foreground">
                    {entrega ? BRL.format(entrega.preco) : "Defina a localizacao"}
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
              Enviar no WhatsApp com localizacao
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
