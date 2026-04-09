"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useAnalytics } from "@/components/AnalyticsProvider"
import { CartDrawer } from "@/components/CartDrawer"
import CategoriasGrid from "@/components/CategoriasGrid"
import RecheioDialog from "@/components/RecheioDialog"
import { produtos } from "@/data/produtos"
import { useCarrinho } from "@/hooks/useCarrinho"
import { reportMetaAddToCart } from "@/lib/metaPixel"
import type { Produto } from "@/types/produto"

export default function Home() {
  const adicionarItem = useCarrinho((state) => state.adicionarItem)
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
    reportMetaAddToCart({
      productId: produto.id,
      productName: produto.nome,
      category: produto.categoria,
      value:
        produto.precoPromocional && produto.precoPromocional < produto.preco
          ? produto.precoPromocional
          : produto.preco,
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-32 pt-8 sm:px-6 sm:pb-28 sm:pt-10">
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
