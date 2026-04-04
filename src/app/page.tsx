"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useAnalytics } from "@/components/AnalyticsProvider"
import { BrandMark } from "@/components/BrandMark"
import { CartDrawer } from "@/components/CartDrawer"
import CategoriasGrid from "@/components/CategoriasGrid"
import RecheioDialog from "@/components/RecheioDialog"
import { Badge } from "@/components/ui/badge"
import { produtos } from "@/data/produtos"
import { useCarrinho } from "@/hooks/useCarrinho"
import { SITE_NAME } from "@/lib/site"
import type { Produto } from "@/types/produto"

export default function Home() {
  const adicionarItem = useCarrinho((state) => state.adicionarItem)
  const itensNoCarrinho = useCarrinho((state) => state.itens.length)
  const { trackEvent } = useAnalytics()

  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [recentAdded, setRecentAdded] = useState<Set<string>>(new Set())
  const timersRef = useRef<Record<string, number>>({})

  const produtosDisponiveis = useMemo(
    () => produtos.filter((produto) => produto.disponivel !== false),
    []
  )

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer))
      timersRef.current = {}
    }
  }, [])

  function marcarAdicionado(id: string) {
    setRecentAdded((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id])
    }

    timersRef.current[id] = window.setTimeout(() => {
      setRecentAdded((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      delete timersRef.current[id]
    }, 1400)
  }

  function adicionarProduto(produto: Produto, recheios?: string[]) {
    adicionarItem({
      id: produto.id,
      nome: produto.nome,
      preco:
        produto.precoPromocional && produto.precoPromocional < produto.preco
          ? produto.precoPromocional
          : produto.preco,
      recheios: recheios && recheios.length > 0 ? recheios : undefined,
    })

    marcarAdicionado(produto.id)
    void trackEvent({
      type: "product_add",
      productId: produto.id,
      productName: produto.nome,
      value:
        produto.precoPromocional && produto.precoPromocional < produto.preco
          ? produto.precoPromocional
          : produto.preco,
      metadata: {
        categoria: produto.categoria,
        recheios: recheios ?? [],
      },
    })
    toast.success(`${produto.nome} foi adicionado ao carrinho.`)
  }

  function handleSelecionar(produto: Produto) {
    if (produto.permiteRecheios) {
      setProdutoSelecionado(produto)
      setDialogAberto(true)
      return
    }

    adicionarProduto(produto)
  }

  function handleConfirmarRecheios(recheios: string[]) {
    if (!produtoSelecionado) return

    adicionarProduto(produtoSelecionado, recheios)
    setDialogAberto(false)
    setProdutoSelecionado(null)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-28 pt-8 sm:px-6">
      <section className="relative overflow-hidden rounded-[38px] border border-border bg-[linear-gradient(180deg,rgba(255,249,239,0.98),rgba(252,238,206,0.98))] shadow-[0_24px_60px_rgba(117,54,20,0.12)]">
        <div className="brand-pattern-strip absolute inset-x-0 top-0 h-7 opacity-95 sm:h-9" />
        <div className="brand-pattern-strip absolute inset-x-0 bottom-0 h-7 rotate-180 opacity-95 sm:h-9" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,71,29,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(92,128,59,0.14),transparent_24%),radial-gradient(circle_at_center,rgba(245,168,47,0.22),transparent_42%)]" />

        <div className="relative grid gap-8 px-5 pb-9 pt-10 sm:px-8 sm:pb-11 sm:pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="space-y-5 lg:pr-4">
            <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
              Marca da casa, pedido rápido e entrega inteligente
            </Badge>

            <h1 className="sr-only">{SITE_NAME}</h1>
            <BrandMark size="lg" showTagline />

            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Monte seu pedido, personalize os recheios e envie pelo WhatsApp com a
              localização pronta para agilizar a entrega.
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-background/75">
                Pedido no WhatsApp
              </Badge>
              <Badge variant="outline" className="bg-background/75">
                Instalável no celular
              </Badge>
              <Badge variant="outline" className="bg-background/75">
                {itensNoCarrinho} item(ns) no carrinho
              </Badge>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-[22px] border border-border/70 bg-background/72 p-4 shadow-[0_14px_30px_rgba(93,41,16,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                  Receita marcante
                </p>
                <p className="mt-2 leading-6">
                  A identidade da marca agora guia a capa, o topo e os detalhes do site com a
                  mesma energia da sua arte.
                </p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-background/72 p-4 shadow-[0_14px_30px_rgba(93,41,16,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                  Fluxo simples
                </p>
                <p className="mt-2 leading-6">
                  O cardápio continua direto: escolher, personalizar, confirmar localização e
                  enviar.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-[580px] overflow-hidden rounded-[34px] border border-[#A35B1D]/20 bg-[linear-gradient(180deg,#F7AB2F,#F4A12A)] p-3 shadow-[0_28px_70px_rgba(92,38,14,0.22)]">
              <div className="brand-pattern-strip absolute inset-x-3 top-3 h-6 sm:h-7" />
              <div className="brand-pattern-strip absolute inset-x-3 bottom-3 h-6 rotate-180 sm:h-7" />

              <div className="relative rounded-[28px] border border-[#9C551E]/10 bg-[radial-gradient(circle_at_top_left,rgba(255,231,176,0.36),transparent_24%),linear-gradient(180deg,rgba(245,169,53,0.98),rgba(240,156,36,0.98))] px-4 pb-20 pt-12 sm:px-7 sm:pb-24 sm:pt-14">
                <Image
                  src="/brand/logo-josi.png"
                  alt="Logo Acarajé da Josi com moldura estampada"
                  width={1024}
                  height={1024}
                  priority
                  className="mx-auto w-full max-w-[430px] h-auto"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 70vw, 42vw"
                />

                <div className="absolute bottom-4 right-4 flex w-[220px] items-center gap-3 rounded-[24px] border border-white/35 bg-[linear-gradient(180deg,rgba(255,251,244,0.96),rgba(255,244,223,0.92))] p-3 shadow-[0_18px_38px_rgba(86,37,14,0.18)] backdrop-blur-sm sm:w-[250px]">
                  <div className="relative size-14 overflow-hidden rounded-[18px] border border-border/60 sm:size-16">
                    <Image
                      src="/images/acaraje-gigante.jpg"
                      alt="Acarajé gigante servido"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                      Capa da casa
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      Marca forte com presença de tabuleiro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CategoriasGrid
        produtos={produtosDisponiveis}
        addedIds={recentAdded}
        onSelecionar={handleSelecionar}
      />

      {produtoSelecionado ? (
        <RecheioDialog
          aberto={dialogAberto}
          produto={produtoSelecionado}
          onClose={() => {
            setDialogAberto(false)
            setProdutoSelecionado(null)
          }}
          onConfirmar={handleConfirmarRecheios}
        />
      ) : null}

      <CartDrawer />
    </main>
  )
}
