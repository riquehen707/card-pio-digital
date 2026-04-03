"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ShoppingBag, Smartphone, Truck } from "lucide-react"
import { toast } from "sonner"

import { CartDrawer } from "@/components/CartDrawer"
import CategoriasGrid from "@/components/CategoriasGrid"
import RecheioDialog from "@/components/RecheioDialog"
import { Badge } from "@/components/ui/badge"
import { produtos } from "@/data/produtos"
import { useCarrinho } from "@/hooks/useCarrinho"
import { useAnalytics } from "@/components/AnalyticsProvider"
import { SITE_NAME } from "@/lib/site"
import type { Produto } from "@/types/produto"

function HeroCard({
  titulo,
  descricao,
  icon,
}: {
  titulo: string
  descricao: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[28px] border border-border bg-card/80 p-4 shadow-sm">
      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="font-semibold text-foreground">{titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
    </div>
  )
}

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
      <section className="overflow-hidden rounded-[36px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_34%),radial-gradient(circle_at_right,_rgba(251,191,36,0.22),_transparent_28%),linear-gradient(180deg,rgba(255,251,239,1),rgba(255,255,255,1))] p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl space-y-5">
          <Badge variant="secondary" className="w-fit">
            Pedido rapido, PWA e localizacao fixa
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {SITE_NAME}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Escolha seus itens, salve sua localizacao uma vez e envie o pedido pelo WhatsApp
              com a taxa de entrega calculada automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Carrinho persistente</Badge>
            <Badge variant="outline">Instalavel no celular</Badge>
            <Badge variant="outline">{itensNoCarrinho} item(ns) no carrinho</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <HeroCard
          titulo="Peca em poucos passos"
          descricao="O fluxo foi simplificado para sair do cardapio ao WhatsApp sem perder o contexto."
          icon={<ShoppingBag className="size-5" />}
        />
        <HeroCard
          titulo="Entrega calculada por distancia"
          descricao="A taxa usa a localizacao fixa salva ou um link alternativo do Google Maps."
          icon={<Truck className="size-5" />}
        />
        <HeroCard
          titulo="Pronto para instalar"
          descricao="O site agora pode funcionar como app no celular, com suporte offline basico."
          icon={<Smartphone className="size-5" />}
        />
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
