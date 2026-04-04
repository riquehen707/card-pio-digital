"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Flame, MapPin, Sparkles } from "lucide-react"
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-32 pt-8 sm:px-6 sm:pb-28">
      <section className="relative overflow-hidden rounded-[34px] border border-border bg-[linear-gradient(180deg,rgba(255,249,239,0.98),rgba(252,238,206,0.98))] shadow-[0_24px_60px_rgba(117,54,20,0.12)]">
        <div className="brand-pattern-strip absolute inset-x-0 top-0 h-6 opacity-95 sm:h-8" />
        <div className="brand-pattern-strip absolute inset-x-0 bottom-0 h-6 rotate-180 opacity-95 sm:h-8" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,71,29,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(92,128,59,0.12),transparent_22%),radial-gradient(circle_at_center,rgba(245,168,47,0.18),transparent_42%)]" />

        <div className="relative space-y-6 px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-12">
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
            Pedido rápido, localização salva e envio no WhatsApp
          </Badge>

          <h1 className="sr-only">{SITE_NAME}</h1>
          <BrandMark size="lg" showTagline />

          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Monte seu pedido, escolha a pimenta se quiser, defina a forma de pagamento e envie
            tudo pelo WhatsApp com a localização pronta para agilizar a entrega.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-background/75">
              <Sparkles className="size-3.5" />
              Pedido no WhatsApp
            </Badge>
            <Badge variant="outline" className="bg-background/75">
              <Flame className="size-3.5" />
              Pimenta opcional
            </Badge>
            <Badge variant="outline" className="bg-background/75">
              <MapPin className="size-3.5" />
              Entrega calibrada por distância
            </Badge>
            <Badge variant="outline" className="bg-background/75">
              {itensNoCarrinho} item(ns) no carrinho
            </Badge>
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
