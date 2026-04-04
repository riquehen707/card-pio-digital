"use client"

import * as React from "react"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Produto } from "@/types/produto"

type Props = {
  produto: Produto
  onSelecionar: (produto: Produto) => void
  added?: boolean
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function ProductImageFallback({ nome }: { nome: string }) {
  const initials =
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "?"

  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(183,86,24,0.34),_transparent_58%),radial-gradient(circle_at_bottom_right,_rgba(84,128,54,0.18),_transparent_42%),linear-gradient(180deg,rgba(255,248,235,1),rgba(249,225,173,1))]">
      <span className="text-3xl font-semibold tracking-[0.18em] text-primary/70 sm:text-4xl">
        {initials}
      </span>
    </div>
  )
}

export default function ProductCard({ produto, onSelecionar, added = false }: Props) {
  const [imageFailed, setImageFailed] = React.useState(false)

  const precoAtual =
    produto.precoPromocional &&
    produto.precoPromocional > 0 &&
    produto.precoPromocional < produto.preco
      ? produto.precoPromocional
      : produto.preco

  const hasImage = Boolean(produto.imagem) && !imageFailed
  const indisponivel = produto.disponivel === false

  return (
    <Card className="group h-full overflow-hidden rounded-[28px] border-border/80 bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(255,244,221,0.96))] shadow-[0_18px_44px_rgba(117,54,20,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(117,54,20,0.12)]">
      <div className="relative aspect-[1/1] overflow-hidden sm:aspect-[4/3]">
        {hasImage ? (
          <Image
            src={produto.imagem!}
            alt={produto.nome}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 42vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ProductImageFallback nome={produto.nome} />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:max-w-[calc(100%-1.5rem)] sm:gap-2">
          {produto.permiteRecheios ? (
            <Badge
              variant="secondary"
              className="border border-white/35 bg-white/82 px-2 py-0.5 text-[10px] text-foreground shadow-sm sm:px-3 sm:py-1 sm:text-xs"
            >
              Personalizável
            </Badge>
          ) : null}
          {added ? <Badge variant="success">Adicionado</Badge> : null}
        </div>

        <div className="absolute bottom-2 left-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm sm:bottom-3 sm:left-3">
          {produto.categoria}
        </div>

        {indisponivel ? (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <Badge variant="outline" className="border-white/40 bg-black/35 text-white">
              Indisponível
            </Badge>
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-3 p-3 sm:p-5">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg sm:leading-tight">
            {produto.nome}
          </h3>
          <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
            {produto.permiteRecheios
              ? "Monte do seu jeito, incluindo pimenta se quiser."
              : "Pedido rápido para adicionar ao carrinho."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-primary sm:text-xl">
              {BRL.format(precoAtual)}
            </span>
            {produto.precoPromocional && produto.precoPromocional < produto.preco ? (
              <span className="text-xs text-muted-foreground line-through sm:text-sm">
                {BRL.format(produto.preco)}
              </span>
            ) : null}
          </div>

          {!indisponivel ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {produto.permiteRecheios ? "Escolher" : "Adicionar"}
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 sm:p-5 sm:pt-0">
        <Button
          fullWidth
          onClick={() => onSelecionar(produto)}
          disabled={indisponivel}
          className="h-10 rounded-2xl px-3 text-xs sm:h-11 sm:px-5 sm:text-sm"
        >
          <ShoppingCart className="size-4" />
          {produto.permiteRecheios ? (
            <>
              <span className="sm:hidden">Montar</span>
              <span className="hidden sm:inline">Escolher recheios e extras</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">Adicionar</span>
              <span className="hidden sm:inline">Adicionar ao carrinho</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
