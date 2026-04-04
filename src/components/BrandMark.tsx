import { SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  hideText?: boolean
  showTagline?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: {
    gap: "gap-3",
    tile: "size-12 rounded-[16px]",
    stripe: "h-2.5",
    inset: "inset-x-[10%]",
    title: "text-2xl",
    subtitle: "text-[11px]",
    monogram: "text-[1.55rem]",
  },
  md: {
    gap: "gap-3.5",
    tile: "size-[3.75rem] rounded-[18px]",
    stripe: "h-3",
    inset: "inset-x-[11%]",
    title: "text-[2rem]",
    subtitle: "text-xs",
    monogram: "text-[1.95rem]",
  },
  lg: {
    gap: "gap-4",
    tile: "size-20 rounded-[22px]",
    stripe: "h-4",
    inset: "inset-x-[12%]",
    title: "text-[2.9rem] leading-[0.92] sm:text-[4.4rem]",
    subtitle: "text-sm sm:text-base",
    monogram: "text-[2.5rem] sm:text-[3rem]",
  },
} as const

export function BrandMark({
  className,
  hideText = false,
  showTagline = false,
  size = "md",
}: BrandMarkProps) {
  const current = sizeMap[size]

  return (
    <div className={cn("flex items-center", current.gap, className)}>
      <div
        aria-hidden="true"
        className={cn(
          "relative shrink-0 overflow-hidden border border-[#6d3822]/18 bg-[#F5A82F] shadow-[0_16px_35px_rgba(102,43,15,0.14)]",
          current.tile
        )}
      >
        <div className={cn("brand-pattern-strip absolute inset-x-0 top-0 opacity-95", current.stripe)} />
        <div
          className={cn("brand-pattern-strip absolute inset-x-0 bottom-0 rotate-180 opacity-95", current.stripe)}
        />
        <div className={cn("absolute inset-y-[18%] rounded-[22%] bg-[linear-gradient(180deg,rgba(248,188,74,0.96),rgba(242,161,36,0.98))]", current.inset)} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <span
            className={cn("leading-none text-[#4B241D]", current.monogram)}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
          >
            AJ
          </span>
          <span className="h-1 w-[42%] rounded-full bg-[#E9471D]" />
        </div>
      </div>

      {hideText ? null : (
        <div className="space-y-1">
          <div
            className={cn("leading-none text-[#4B241D]", current.title)}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
          >
            {SITE_NAME}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("font-semibold uppercase tracking-[0.18em] text-[#E9471D]", current.subtitle)}>
              Tabuleiro baiano
            </span>
            {showTagline ? (
              <span className="text-sm text-muted-foreground">
                Receita com presença forte e pedido simples.
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
