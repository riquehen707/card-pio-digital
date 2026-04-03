"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// -------------------------------------
// Contexto para aria-labelledby/aria-describedby
// -------------------------------------
type DrawerCtx = {
  titleId?: string
  setTitleId: (id?: string) => void
  descriptionId?: string
  setDescriptionId: (id?: string) => void
}
const DrawerA11yCtx = React.createContext<DrawerCtx | null>(null)

// -------------------------------------
// Variantes
// -------------------------------------
const overlayVariants = cva(
  [
    "fixed inset-0 z-50",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  ].join(" "),
  {
    variants: {
      overlayKind: {
        solid: "bg-black/50",
        blur: "backdrop-blur-sm bg-black/40",
      },
    },
    defaultVariants: { overlayKind: "solid" },
  }
)

const contentVariants = cva(
  [
    // base
    "group/drawer-content bg-background fixed z-50 flex flex-col border shadow-lg",
    "data-[state=open]:animate-in data-[state=closed]:animate-out transition-transform duration-200",
    // POSICIONAMENTO POR DIREÇÃO (sempre na base; ativam via data-attr do Vaul)
    "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:border-b",
    "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:border-t",
    "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:border-l",
    "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:border-r",
  ].join(" "),
  {
    variants: {
      padded: {
        true: "p-4 sm:p-6",
        false: "",
      },
      radius: {
        sm: [
          "data-[vaul-drawer-direction=top]:rounded-b-lg",
          "data-[vaul-drawer-direction=bottom]:rounded-t-lg",
          "data-[vaul-drawer-direction=right]:rounded-l-lg",
          "data-[vaul-drawer-direction=left]:rounded-r-lg",
        ].join(" "),
        md: [
          "data-[vaul-drawer-direction=top]:rounded-b-xl",
          "data-[vaul-drawer-direction=bottom]:rounded-t-xl",
          "data-[vaul-drawer-direction=right]:rounded-l-xl",
          "data-[vaul-drawer-direction=left]:rounded-r-xl",
        ].join(" "),
        lg: [
          "data-[vaul-drawer-direction=top]:rounded-b-2xl",
          "data-[vaul-drawer-direction=bottom]:rounded-t-2xl",
          "data-[vaul-drawer-direction=right]:rounded-l-2xl",
          "data-[vaul-drawer-direction=left]:rounded-r-2xl",
        ].join(" "),
        xl: [
          "data-[vaul-drawer-direction=top]:rounded-b-3xl",
          "data-[vaul-drawer-direction=bottom]:rounded-t-3xl",
          "data-[vaul-drawer-direction=right]:rounded-l-3xl",
          "data-[vaul-drawer-direction=left]:rounded-r-3xl",
        ].join(" "),
      },
      // Aplica TANTO altura (top/bottom) quanto largura (left/right)
      size: {
        sm: [
          "data-[vaul-drawer-direction=top]:max-h-[45vh]",
          "data-[vaul-drawer-direction=bottom]:max-h-[45vh]",
          "data-[vaul-drawer-direction=right]:w-[75vw] data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:w-[75vw] data-[vaul-drawer-direction=left]:sm:max-w-sm",
        ].join(" "),
        md: [
          "data-[vaul-drawer-direction=top]:max-h-[60vh]",
          "data-[vaul-drawer-direction=bottom]:max-h-[60vh]",
          "data-[vaul-drawer-direction=right]:w-[80vw] data-[vaul-drawer-direction=right]:sm:max-w-md",
          "data-[vaul-drawer-direction=left]:w-[80vw] data-[vaul-drawer-direction=left]:sm:max-w-md",
        ].join(" "),
        lg: [
          "data-[vaul-drawer-direction=top]:max-h-[75vh]",
          "data-[vaul-drawer-direction=bottom]:max-h-[75vh]",
          "data-[vaul-drawer-direction=right]:w-[85vw] data-[vaul-drawer-direction=right]:sm:max-w-lg",
          "data-[vaul-drawer-direction=left]:w-[85vw] data-[vaul-drawer-direction=left]:sm:max-w-lg",
        ].join(" "),
        xl: [
          "data-[vaul-drawer-direction=top]:max-h-[85vh]",
          "data-[vaul-drawer-direction=bottom]:max-h-[85vh]",
          "data-[vaul-drawer-direction=right]:w-[90vw] data-[vaul-drawer-direction=right]:sm:max-w-xl",
          "data-[vaul-drawer-direction=left]:w-[90vw] data-[vaul-drawer-direction=left]:sm:max-w-xl",
        ].join(" "),
      },
      elevated: {
        true: "shadow-xl",
        false: "",
      },
    },
    defaultVariants: {
      padded: true,
      radius: "md",
      size: "md",
      elevated: false,
    },
  }
)

export type DrawerOverlayProps = React.ComponentProps<typeof DrawerPrimitive.Overlay> &
  VariantProps<typeof overlayVariants>

export type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof contentVariants>

// -------------------------------------
// Primitivos Vaul (Root/Trigger/Portal/Close)
// -------------------------------------
function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

// -------------------------------------
// Overlay (com variantes)
// -------------------------------------
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  DrawerOverlayProps
>(({ className, overlayKind, ...props }, ref) => {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      data-slot="drawer-overlay"
      className={cn(overlayVariants({ overlayKind }), className)}
      {...props}
    />
  )
})
DrawerOverlay.displayName = "DrawerOverlay"

// -------------------------------------
// Content (com variantes + a11y com Title/Description)
// -------------------------------------
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className, padded, radius, size, elevated, children, ...props }, ref) => {
  const [titleId, setTitleId] = React.useState<string | undefined>()
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>()

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerA11yCtx.Provider value={{ titleId, setTitleId, descriptionId, setDescriptionId }}>
        <DrawerPrimitive.Content
          ref={ref}
          data-slot="drawer-content"
          className={cn(contentVariants({ padded, radius, size, elevated }), className)}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          {...props}
        >
          {/* “Grip” visível apenas em top/bottom */}
          <div className="bg-muted/80 mx-auto mt-2 hidden h-1.5 w-[92px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block group-data-[vaul-drawer-direction=top]/drawer-content:block" />
          {children}
        </DrawerPrimitive.Content>
      </DrawerA11yCtx.Provider>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

// -------------------------------------
// Header/Footer
// -------------------------------------
const DrawerHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 md:gap-1.5 md:p-6",
        "group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center",
        "group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:text-left",
        className
      )}
      {...props}
    />
  )
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4 md:p-6", className)}
      {...props}
    />
  )
)
DrawerFooter.displayName = "DrawerFooter"

// -------------------------------------
// Title/Description registram IDs no contexto
// -------------------------------------
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentProps<typeof DrawerPrimitive.Title>
>(({ className, id, ...props }, ref) => {
  const ctx = React.useContext(DrawerA11yCtx)
  const autoId = React.useId()
  const theId = id ?? autoId

  React.useEffect(() => {
    ctx?.setTitleId(theId)
    return () => ctx?.setTitleId(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theId])

  return (
    <DrawerPrimitive.Title
      ref={ref}
      id={theId}
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
})
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentProps<typeof DrawerPrimitive.Description>
>(({ className, id, ...props }, ref) => {
  const ctx = React.useContext(DrawerA11yCtx)
  const autoId = React.useId()
  const theId = id ?? autoId

  React.useEffect(() => {
    ctx?.setDescriptionId(theId)
    return () => ctx?.setDescriptionId(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theId])

  return (
    <DrawerPrimitive.Description
      ref={ref}
      id={theId}
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
})
DrawerDescription.displayName = "DrawerDescription"

// -------------------------------------
// Exports
// -------------------------------------
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  overlayVariants,
  contentVariants,
}
