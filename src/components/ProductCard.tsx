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
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border-white/75 bg-[linear-gradient(180deg,rgba(255,254,250,0.98),rgba(255,244,221,0.96))] shadow-[0_18px_40px_rgba(117,54,20,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/18 hover:shadow-[0_26px_58px_rgba(117,54,20,0.14)]">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80" />

      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3]">
        {hasImage ? (
          <Image
            src={produto.imagem!}
            alt={produto.nome}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ProductImageFallback nome={produto.nome} />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/18 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 via-black/8 to-transparent" />

        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:max-w-[calc(100%-1.5rem)] sm:gap-2">
          {produto.permiteRecheios ? (
            <Badge
              variant="secondary"
              className="border border-white/35 bg-white/82 px-2 py-0.5 text-[10px] text-foreground shadow-sm sm:px-3 sm:py-1 sm:text-xs"
            >
              Personalizável
            </Badge>
          ) : null}
          {added ? <Badge variant="success">No carrinho</Badge> : null}
        </div>

        {indisponivel ? (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <Badge variant="outline" className="border-white/40 bg-black/35 text-white">
              Indisponível
            </Badge>
          </div>
        ) : null}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-3 sm:p-5">
        <div className="space-y-1.5">
          <h3 className="min-h-[2.7rem] text-[15px] font-semibold leading-snug text-foreground sm:min-h-[3rem] sm:text-lg sm:leading-tight">
            {produto.nome}
          </h3>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary/72 sm:text-xs">
            {produto.permiteRecheios ? "Escolha os recheios no próximo passo" : "Adição rápida ao carrinho"}
          </p>
        </div>

        <div className="mt-auto rounded-[22px] border border-border/70 bg-white/55 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Preço
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-semibold text-primary sm:text-xl">
                  {BRL.format(precoAtual)}
                </span>
                {produto.precoPromocional && produto.precoPromocional < produto.preco ? (
                  <span className="text-xs text-muted-foreground line-through sm:text-sm">
                    {BRL.format(produto.preco)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 bg-white/35 p-3 pt-3 sm:p-5 sm:pt-4">
        <Button
          fullWidth
          onClick={() => onSelecionar(produto)}
          disabled={indisponivel}
          className="h-11 rounded-2xl px-3 text-xs shadow-[0_10px_24px_rgba(117,54,20,0.16)] sm:h-11 sm:px-5 sm:text-sm"
        >
          <ShoppingCart className="size-4" />
          <span>{produto.permiteRecheios ? "Personalizar" : "Adicionar"}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
