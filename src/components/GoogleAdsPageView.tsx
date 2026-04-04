"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { GOOGLE_ADS_ID } from "@/lib/site"

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function GoogleAdsPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return
    }

    const queryString = searchParams.toString()
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname

    window.gtag("config", GOOGLE_ADS_ID, {
      page_path: pagePath,
    })
  }, [pathname, searchParams])

  return null
}
