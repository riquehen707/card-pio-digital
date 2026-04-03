"use client"

import * as React from "react"

import { RECHEIOS_PADRAO } from "@/data/recheios"
import type { Produto } from "@/types/produto"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  aberto: boolean
  produto: Produto
  onConfirmar: (recheios: string[]) => void
  onClose: () => void
}

export default function RecheioDialog({ aberto, produto, onConfirmar, onClose }: Props) {
  const [selecionados, setSelecionados] = React.useState<string[]>([])

  React.useEffect(() => {
    if (aberto) {
      setSelecionados([])
    }
  }, [aberto, produto.id])

  function toggleRecheio(recheio: string, checked: boolean) {
    setSelecionados((prev) => {
      if (checked && !prev.includes(recheio)) {
        return [...prev, recheio]
      }

      if (!checked) {
        return prev.filter((item) => item !== recheio)
      }

      return prev
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-[28px] border-none bg-card">
        <DialogHeader>
          <DialogTitle>Escolha os recheios de {produto.nome}</DialogTitle>
          <DialogDescription>
            Se preferir, voce tambem pode confirmar sem recheios e seguir direto para o carrinho.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {RECHEIOS_PADRAO.map((recheio) => {
            const id = `recheio-${recheio}`
            const checked = selecionados.includes(recheio)

            return (
              <label
                key={recheio}
                htmlFor={id}
                className="flex items-center gap-3 rounded-3xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(value) => toggleRecheio(recheio, value === true)}
                />
                <span>{recheio}</span>
              </label>
            )
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selecionados.length} {selecionados.length === 1 ? "item selecionado" : "itens selecionados"}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose} className="rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={() => onConfirmar(selecionados)} className="rounded-2xl">
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
