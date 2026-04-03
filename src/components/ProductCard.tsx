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
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.28),_transparent_60%),linear-gradient(180deg,rgba(255,248,235,1),rgba(253,242,208,1))]">
      <span className="text-4xl font-semibold tracking-[0.2em] text-primary/70">{initials}</span>
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
      <Card className="group h-full border-border/80 bg-card/90">
        <div className="relative aspect-[4/3] overflow-hidden">
          {hasImage ? (
            <Image
              src={produto.imagem!}
              alt={produto.nome}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 100vw"
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
              className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={`Ampliar imagem de ${produto.nome}`}
            >
              <Maximize2 className="size-4" />
            </button>
          ) : null}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {produto.permiteRecheios ? <Badge variant="secondary">Personalizavel</Badge> : null}
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

        <CardContent className="space-y-3 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight text-foreground">{produto.nome}</h3>
            <p className="text-sm text-muted-foreground">{produto.categoria}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-primary">{BRL.format(precoAtual)}</span>
            {produto.precoPromocional && produto.precoPromocional < produto.preco ? (
              <span className="text-sm text-muted-foreground line-through">
                {BRL.format(produto.preco)}
              </span>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          <Button fullWidth onClick={() => onSelecionar(produto)} disabled={indisponivel} className="rounded-2xl">
            <ShoppingCart className="size-4" />
            {produto.permiteRecheios ? "Escolher recheios" : "Adicionar ao carrinho"}
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
