"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ----------------------
// Contexto para A11y (Title/Description)
// ----------------------
type Ctx = {
  titleId?: string
  setTitleId: (id?: string) => void
  descriptionId?: string
  setDescriptionId: (id?: string) => void
}
const DialogCtx = React.createContext<Ctx | null>(null)

// ----------------------
// Variantes de Overlay e Content
// ----------------------
const overlayVariants = cva(
  [
    "fixed inset-0 z-50",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  ].join(" "),
  {
    variants: {
      kind: {
        solid: "bg-black/50",
        blur: "backdrop-blur-sm bg-black/40",
      },
    },
    defaultVariants: { kind: "solid" },
  }
)

const contentVariants = cva(
  [
    "fixed left-1/2 top-1/2 z-50 grid w-full translate-x-[-50%] translate-y-[-50%]",
    "border bg-background shadow-lg",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "duration-200",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-xl",
        xl: "max-w-2xl",
      },
      radius: {
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
        full: "rounded-[28px]",
      },
      inset: {
        center: "top-1/2",
        top: "top-8 translate-y-0",
      },
      fullScreenOnMobile: {
        true: "sm:max-h-[85vh] max-h-[100svh] max-w-[100svw] sm:max-w-none sm:w-auto sm:rounded-[inherit] sm:translate-y-[-50%] sm:top-1/2",
        false: "",
      },
      padding: {
        sm: "p-4 gap-3",
        md: "p-6 gap-4",
        lg: "p-8 gap-5",
      },
    },
    compoundVariants: [
      { size: "sm", padding: "sm", class: "" },
      { size: "md", padding: "md", class: "" },
      { size: "lg", padding: "md", class: "" },
      { size: "xl", padding: "lg", class: "" },
    ],
    defaultVariants: {
      size: "md",
      radius: "md",
      inset: "center",
      fullScreenOnMobile: false,
      padding: "md",
    },
  }
)

const closeButtonVariants = cva(
  [
    "ring-offset-background focus:ring-ring",
    "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
    "transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2",
    "disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        icon: "rounded-xs opacity-70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        text: "rounded-md px-2 py-1 text-sm opacity-90",
      },
      position: {
        inside: "absolute top-4 right-4",
        outside:
          // útil quando se coloca um header custom fora do content (barra superior)
          "absolute -top-10 right-0 sm:-top-12",
      },
    },
    defaultVariants: { variant: "icon", position: "inside" },
  }
)

// ----------------------
// Componentes base do Radix (sem mudanças de API)
// ----------------------
function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(
  props: React.ComponentProps<typeof DialogPrimitive.Portal>
) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>
) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

// ----------------------
// Overlay com variantes
// ----------------------
type DialogOverlayProps = React.ComponentProps<
  typeof DialogPrimitive.Overlay
> &
  VariantProps<typeof overlayVariants>

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, kind, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(overlayVariants({ kind }), className)}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

// ----------------------
// Content com A11y automático e variantes
// ----------------------
type DialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> &
  VariantProps<typeof contentVariants> & {
    showCloseButton?: boolean
    closeButtonLabel?: string
    closeButtonVariant?: VariantProps<typeof closeButtonVariants>["variant"]
    closeButtonPosition?: VariantProps<typeof closeButtonVariants>["position"]
    fallbackTitle?: string // usado se não houver <DialogTitle>
  }

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      size,
      radius,
      inset,
      fullScreenOnMobile,
      padding,
      showCloseButton = true,
      closeButtonLabel = "Fechar",
      closeButtonVariant = "icon",
      closeButtonPosition = "inside",
      fallbackTitle = "Diálogo",
      ...props
    },
    ref
  ) => {
    const [titleId, setTitleId] = React.useState<string | undefined>()
    const [descriptionId, setDescriptionId] = React.useState<
      string | undefined
    >()
    const hadTitle = Boolean(titleId)

    return (
      <DialogPortal data-slot="dialog-portal">
        <DialogOverlay />
        <DialogCtx.Provider
          value={{ titleId, setTitleId, descriptionId, setDescriptionId }}
        >
          <DialogPrimitive.Content
            ref={ref}
            data-slot="dialog-content"
            className={cn(
              contentVariants({
                size,
                radius,
                inset,
                fullScreenOnMobile,
                padding,
              }),
              "w-full max-w-[calc(100%-2rem)] sm:w-auto",
              className
            )}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            {...props}
          >
            {/* Conteúdo real */}
            {children}

            {/* Botão de fechar (opcional) */}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                className={cn(
                  closeButtonVariants({
                    variant: closeButtonVariant,
                    position: closeButtonPosition,
                  })
                )}
              >
                {closeButtonVariant === "icon" ? <XIcon /> : closeButtonLabel}
                {closeButtonVariant === "icon" ? (
                  <span className="sr-only">{closeButtonLabel}</span>
                ) : null}
              </DialogPrimitive.Close>
            )}

            {/* A11y fail-safe: se não houver título visível, injeta um oculto */}
            {!hadTitle && (
              <VisuallyHidden>
                <DialogPrimitive.Title id={(function () {
                  const id = `dlg-title-${Math.random().toString(36).slice(2)}`
                  // registra no contexto para aria-labelledby
                  setTitleId(id)
                  return id
                })()}>
                  {fallbackTitle}
                </DialogPrimitive.Title>
              </VisuallyHidden>
            )}
          </DialogPrimitive.Content>
        </DialogCtx.Provider>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = "DialogContent"

// ----------------------
// Header/Footer (estilização básica)
// ----------------------
const DialogHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
)
DialogFooter.displayName = "DialogFooter"

// ----------------------
// Title/Description que registram IDs no contexto
// ----------------------
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentProps<typeof DialogPrimitive.Title>
>(({ className, id, ...props }, ref) => {
  const ctx = React.useContext(DialogCtx)
  const autoId = React.useId()
  const theId = id ?? autoId

  React.useEffect(() => {
    ctx?.setTitleId(theId)
    return () => ctx?.setTitleId(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theId])

  return (
    <DialogPrimitive.Title
      ref={ref}
      id={theId}
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
})
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentProps<typeof DialogPrimitive.Description>
>(({ className, id, ...props }, ref) => {
  const ctx = React.useContext(DialogCtx)
  const autoId = React.useId()
  const theId = id ?? autoId

  React.useEffect(() => {
    ctx?.setDescriptionId(theId)
    return () => ctx?.setDescriptionId(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theId])

  return (
    <DialogPrimitive.Description
      ref={ref}
      id={theId}
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
})
DialogDescription.displayName = "DialogDescription"

// ----------------------
// Exports
// ----------------------
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogContent,
  overlayVariants,
  contentVariants,
}
