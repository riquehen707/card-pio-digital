"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  [
    "w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-colors",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      resize: {
        none: "resize-none",
        y: "resize-y",
        xy: "resize",
      },
      invalid: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
    },
    defaultVariants: {
      resize: "y",
      invalid: false,
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, resize, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ resize, invalid }), className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { textareaVariants }
