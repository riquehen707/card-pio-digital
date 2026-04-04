"use client"

import * as React from "react"
import { Flame, PlusCircle } from "lucide-react"

import { OPCOES_COMIDA } from "@/data/recheios"
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
import { cn } from "@/lib/utils"
import type { Produto } from "@/types/produto"

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
      <DialogContent className="max-w-xl rounded-[28px] border-none bg-card p-0 overflow-hidden">
        <div className="brand-pattern-strip h-4 w-full opacity-95" />

        <div className="space-y-6 p-5 sm:p-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <PlusCircle className="size-3.5" />
              Monte do seu jeito
            </div>
            <DialogTitle>Escolha os complementos de {produto.nome}</DialogTitle>
            <DialogDescription>
              Se preferir, você também pode confirmar sem adicionais e seguir direto para o
              carrinho. A pimenta entrou como opcional para facilitar o pedido.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {OPCOES_COMIDA.map((recheio) => {
              const id = `recheio-${produto.id}-${recheio}`
              const checked = selecionados.includes(recheio)
              const isPimenta = recheio === "Pimenta"

              return (
                <label
                  key={recheio}
                  htmlFor={id}
                  className={cn(
                    "flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm transition-colors",
                    checked
                      ? "border-primary/35 bg-primary/10 text-foreground shadow-[0_12px_28px_rgba(117,54,20,0.08)]"
                      : "border-border bg-background hover:bg-accent"
                  )}
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) => toggleRecheio(recheio, value === true)}
                  />
                  <span className="flex min-w-0 items-center gap-2">
                    {isPimenta ? <Flame className="size-4 text-primary" /> : null}
                    <span>{recheio}</span>
                  </span>
                </label>
              )
            })}
          </div>

          <DialogFooter className="flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selecionados.length}{" "}
              {selecionados.length === 1 ? "opção selecionada" : "opções selecionadas"}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={onClose} className="rounded-2xl">
                Cancelar
              </Button>
              <Button onClick={() => onConfirmar(selecionados)} className="rounded-2xl">
                Confirmar pedido
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
