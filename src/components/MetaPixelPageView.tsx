"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: Window["fbq"]
  }
}

export function MetaPixelPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedPage = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") {
      return
    }

    const queryString = searchParams.toString()
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname

    if (lastTrackedPage.current === pagePath) {
      return
    }

    lastTrackedPage.current = pagePath
    window.fbq("track", "PageView")
  }, [pathname, searchParams])

  return null
}
