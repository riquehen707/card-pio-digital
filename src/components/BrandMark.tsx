import Image from "next/image"

import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  hideCaption?: boolean
  showTagline?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: {
    image: "w-[88px] sm:w-[104px]",
    eyebrow: "text-[10px]",
    tagline: "text-xs",
  },
  md: {
    image: "w-[156px] sm:w-[188px]",
    eyebrow: "text-[11px]",
    tagline: "text-sm",
  },
  lg: {
    image: "w-[260px] sm:w-[340px] lg:w-[420px]",
    eyebrow: "text-[11px] sm:text-xs",
    tagline: "text-sm sm:text-base",
  },
} as const

export function BrandMark({
  className,
  hideCaption = false,
  showTagline = false,
  size = "md",
}: BrandMarkProps) {
  const current = sizeMap[size]

  return (
    <div className={cn("space-y-3", className)}>
      <Image
        src="/brand/logo-josi.png"
        alt="Logo Acarajé da Josi"
        width={1024}
        height={1024}
        priority={size === "lg"}
        className={cn("h-auto", current.image)}
        sizes={
          size === "lg"
            ? "(max-width: 640px) 260px, (max-width: 1024px) 340px, 420px"
            : size === "md"
              ? "(max-width: 640px) 156px, 188px"
              : "(max-width: 640px) 88px, 104px"
        }
      />

      {hideCaption ? null : (
        <div className="space-y-1 pl-1">
          <p className={cn("font-semibold uppercase tracking-[0.22em] text-primary/80", current.eyebrow)}>
            Tabuleiro baiano
          </p>
          {showTagline ? (
            <p className={cn("max-w-xl leading-relaxed text-muted-foreground", current.tagline)}>
              Receita com presença forte, leitura limpa e pedido direto para o WhatsApp.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
