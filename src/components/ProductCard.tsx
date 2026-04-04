"use client"

import * as React from "react"
import Image from "next/image"
import { Maximize2, ShoppingCart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(183,86,24,0.3),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(84,128,54,0.18),_transparent_42%),linear-gradient(180deg,rgba(255,248,235,1),rgba(249,225,173,1))]">
      <span className="text-3xl font-semibold tracking-[0.18em] text-primary/70 sm:text-4xl">
        {initials}
      </span>
    </div>
  )
}

export default function ProductCard({ produto, onSelecionar, added = false }: Props) {
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [imageFailed, setImageFailed] = React.useState(false)

  const precoAtual =
    produto.precoPromocional && produto.precoPromocional > 0 && produto.precoPromocional < produto.preco
      ? produto.precoPromocional
      : produto.preco

  const hasImage = Boolean(produto.imagem) && !imageFailed
  const indisponivel = produto.disponivel === false

  return (
    <>
      <Card className="group h-full border-border/80 bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(255,244,221,0.96))] shadow-[0_18px_44px_rgba(117,54,20,0.08)] transition-transform duration-300 hover:-translate-y-1">
        <div className="relative aspect-[1/1] overflow-hidden sm:aspect-[4/3]">
          {hasImage ? (
            <Image
              src={produto.imagem!}
              alt={produto.nome}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 42vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <ProductImageFallback nome={produto.nome} />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

          {produto.imagem && hasImage ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-3 sm:top-3 sm:size-10"
              aria-label={`Ampliar imagem de ${produto.nome}`}
            >
              <Maximize2 className="size-4" />
            </button>
          ) : null}

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-3rem)] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:max-w-[calc(100%-3.5rem)] sm:gap-2">
            {produto.permiteRecheios ? (
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs">
                Personalizavel
              </Badge>
            ) : null}
            {added ? <Badge variant="success">Adicionado</Badge> : null}
          </div>

          {indisponivel ? (
            <div className="absolute inset-0 grid place-items-center bg-black/45">
              <Badge variant="outline" className="border-white/40 bg-black/35 text-white">
                Indisponivel
              </Badge>
            </div>
          ) : null}
        </div>

        <CardContent className="space-y-2 p-3 sm:space-y-3 sm:p-5">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg sm:leading-tight">
              {produto.nome}
            </h3>
            <p className="text-xs text-muted-foreground sm:text-sm">{produto.categoria}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-primary sm:text-lg">
              {BRL.format(precoAtual)}
            </span>
            {produto.precoPromocional && produto.precoPromocional < produto.preco ? (
              <span className="text-xs text-muted-foreground line-through sm:text-sm">
                {BRL.format(produto.preco)}
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
                <span className="sm:hidden">Recheios</span>
                <span className="hidden sm:inline">Escolher recheios</span>
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

      {produto.imagem && hasImage ? (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl border-none bg-card p-3">
            <DialogHeader>
              <DialogTitle className="sr-only">Imagem ampliada de {produto.nome}</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-muted">
              <Image
                src={produto.imagem}
                alt={`Imagem ampliada de ${produto.nome}`}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
