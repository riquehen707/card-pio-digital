"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useAnalytics } from "@/components/AnalyticsProvider"
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
      <section className="overflow-hidden rounded-[36px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(183,86,24,0.28),_transparent_32%),radial-gradient(circle_at_right,_rgba(84,128,54,0.2),_transparent_30%),linear-gradient(180deg,rgba(255,249,239,1),rgba(255,240,210,1))] p-5 shadow-[0_24px_60px_rgba(117,54,20,0.12)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
              Tabuleiro baiano, pedido rápido e entrega inteligente
            </Badge>

            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {SITE_NAME}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Escolha seus itens, salve sua localização uma vez e envie o pedido pelo
                WhatsApp com a taxa de entrega calculada automaticamente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-background/70">
                Pedido no WhatsApp
              </Badge>
              <Badge variant="outline" className="bg-background/70">
                Instalável no celular
              </Badge>
              <Badge variant="outline" className="bg-background/70">
                {itensNoCarrinho} item(ns) no carrinho
              </Badge>
            </div>

            <p className="max-w-lg text-sm text-muted-foreground">
              Acarajé quente, recheio do seu jeito e um fluxo direto para fechar o pedido sem
              perder tempo.
            </p>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,rgba(122,57,20,0.12),rgba(255,245,225,0.18))] p-3 shadow-[0_24px_50px_rgba(95,42,15,0.18)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[26px] sm:aspect-[16/10] lg:min-h-[420px] lg:aspect-auto">
                <Image
                  src="/images/acaraje-gigante.jpg"
                  alt="Acarajé aberto e recheado em destaque na capa do cardápio"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 42vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(54,20,6,0.08),rgba(54,20,6,0.62))]" />

                <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  Feito na hora
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 sm:bottom-5 sm:left-5 sm:right-5">
                  <div className="w-fit rounded-full border border-white/20 bg-white/16 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    Sabor marcante, pedido simples
                  </div>

                  <div className="max-w-sm rounded-[24px] border border-white/15 bg-[linear-gradient(180deg,rgba(29,16,8,0.68),rgba(29,16,8,0.82))] p-4 text-white shadow-[0_20px_45px_rgba(20,10,4,0.35)] backdrop-blur-md">
                    <p className="text-sm font-semibold sm:text-base">
                      Seu pedido sai daqui para o WhatsApp em poucos toques.
                    </p>
                    <p className="mt-1 text-sm text-white/78">
                      Escolha, personalize e envie com localização pronta para agilizar a
                      entrega.
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
