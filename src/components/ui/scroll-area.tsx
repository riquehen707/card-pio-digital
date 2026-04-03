"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Variantes de aparência (espessura, trilha, raio do thumb, auto-hide)
const scrollbarVariants = cva(
  [
    // base do container da barra
    "group/scrollbar flex select-none touch-none p-px transition-[opacity,background-color]",
    // auto-hide por padrão; mostra ao hover do root/viewport ou quando focado
    "opacity-0 group-hover/scrollarea:opacity-100 group-focus-within/scrollarea:opacity-100",
    // quando o usuário estiver interagindo (Radix adiciona data-state?), garantimos visível
    "data-[state=visible]:opacity-100",
  ].join(" "),
  {
    variants: {
      orientation: {
        vertical: "h-full border-l border-l-transparent",
        horizontal: "h-2.5 flex-col border-t border-t-transparent",
      },
      thickness: {
        thin: "data-[orientation=vertical]:w-2 data-[orientation=horizontal]:h-2",
        normal: "data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:h-2.5",
        thick: "data-[orientation=vertical]:w-3 data-[orientation=horizontal]:h-3",
      },
      track: {
        transparent: "",
        subtle:
          // leve plano de fundo na trilha para separar do conteúdo
          "data-[orientation=vertical]:bg-background/30 data-[orientation=horizontal]:bg-background/30",
        inset:
          // efeito “inset” (trilha levemente marcada)
          "data-[orientation=vertical]:bg-muted/40 data-[orientation=horizontal]:bg-muted/40",
      },
    },
    defaultVariants: {
      orientation: "vertical",
      thickness: "normal",
      track: "transparent",
    },
  }
)

const thumbVariants = cva(
  [
    "relative flex-1 rounded-full bg-border",
    // tamanho mínimo do polegar para usabilidade
    "data-[orientation=vertical]:min-h-[24px] data-[orientation=horizontal]:min-w-[24px]",
    // feedback de hover/active (herda do group/scrollbar)
    "group-hover/scrollbar:bg-foreground/30",
    "group-active/scrollbar:bg-foreground/40",
    // borda interior (pseudo) para contraste em temas claros/escuros
    "after:absolute after:inset-0 after:rounded-inherit after:content-[''] after:ring-1 after:ring-foreground/5",
  ].join(" "),
  {
    variants: {
      radius: {
        sm: "rounded",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      tone: {
        default: "",
        primary: "bg-primary/40 group-hover/scrollbar:bg-primary/50 group-active/scrollbar:bg-primary/60",
        muted: "bg-muted-foreground/30 group-hover/scrollbar:bg-muted-foreground/40 group-active/scrollbar:bg-muted-foreground/50",
      },
    },
    defaultVariants: {
      radius: "full",
      tone: "default",
    },
  }
)

type RootProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /**
   * Espessura da barra (ambas orientações)
   */
  thickness?: VariantProps<typeof scrollbarVariants>["thickness"]
  /**
   * Aparência da trilha da barra
   */
  track?: VariantProps<typeof scrollbarVariants>["track"]
  /**
   * Raio do polegar
   */
  thumbRadius?: VariantProps<typeof thumbVariants>["radius"]
  /**
   * Tom do polegar (default herda de `border`; `primary`/`muted` são alternativas)
   */
  thumbTone?: VariantProps<typeof thumbVariants>["tone"]
  /**
   * Mostrar barra horizontal (além da vertical)
   */
  showHorizontal?: boolean
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  RootProps
>(
  (
    {
      className,
      children,
      thickness = "normal",
      track = "transparent",
      thumbRadius = "full",
      thumbTone = "default",
      showHorizontal = false,
      ...props
    },
    ref
  ) => {
    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        data-slot="scroll-area"
        className={cn(
          // group para controlar auto-hide via hover/focus
          "group/scrollarea relative",
          className
        )}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className={cn(
            "outline-none transition-[box-shadow] focus-visible:ring-[3px] focus-visible:outline-1",
            "focus-visible:ring-ring/50",
            "size-full rounded-[inherit]"
          )}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>

        {/* Barra vertical */}
        <ScrollBar
          orientation="vertical"
          thickness={thickness}
          track={track}
          thumbRadius={thumbRadius}
          thumbTone={thumbTone}
        />

        {/* Opcional: Barra horizontal */}
        {showHorizontal && (
          <ScrollBar
            orientation="horizontal"
            thickness={thickness}
            track={track}
            thumbRadius={thumbRadius}
            thumbTone={thumbTone}
          />
        )}

        <ScrollAreaPrimitive.Corner
          data-slot="scroll-area-corner"
          className="bg-background/60"
        />
      </ScrollAreaPrimitive.Root>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

type ScrollBarBaseProps = React.ComponentProps<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
> &
  Pick<
    RootProps,
    "thickness" | "track" | "thumbRadius" | "thumbTone"
  >

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarBaseProps
>(
  (
    {
      className,
      orientation = "vertical",
      thickness = "normal",
      track = "transparent",
      thumbRadius = "full",
      thumbTone = "default",
      ...props
    },
    ref
  ) => {
    return (
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        data-slot="scroll-area-scrollbar"
        orientation={orientation}
        className={cn(
          scrollbarVariants({ orientation, thickness, track }),
          className
        )}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb
          data-slot="scroll-area-thumb"
          className={cn(
            thumbVariants({ radius: thumbRadius, tone: thumbTone }),
            // pequena almofada para evitar colar na borda externa
            "mx-[1px] my-[1px]"
          )}
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
    )
  }
)
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
