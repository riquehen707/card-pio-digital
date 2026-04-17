"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname } from "next/navigation"

import {
  ANALYTICS_SESSION_KEY,
  ATTRIBUTION_STORAGE_KEY,
  extractAttribution,
  getPagePath,
  hasAttributionParams,
  mergeAttribution,
} from "@/lib/attribution"
import { postJsonInBackground } from "@/lib/postJsonInBackground"
import type { AnalyticsEventInput, AttributionSnapshot } from "@/types/analytics"

type AnalyticsContextValue = {
  sessionId: string | null
  attribution: AttributionSnapshot | null
  trackEvent: (event: AnalyticsEventInput) => Promise<void>
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

function safeParseAttribution(value: string | null) {
  if (!value) return null

  try {
    return JSON.parse(value) as AttributionSnapshot
  } catch {
    return null
  }
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `session_${Date.now()}`
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<AttributionSnapshot | null>(null)
  const lastTrackedPage = useRef<string | null>(null)

  const initializeSession = useCallback(async () => {
    if (typeof window === "undefined") return null

    const activeSearchParams = new URLSearchParams(window.location.search)
    const currentPagePath = getPagePath(pathname, activeSearchParams)
    const existingSession = window.localStorage.getItem(ANALYTICS_SESSION_KEY)
    const nextSessionId = existingSession || createSessionId()

    if (!existingSession) {
      window.localStorage.setItem(ANALYTICS_SESSION_KEY, nextSessionId)
    }

    const previousAttribution = safeParseAttribution(
      window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    )
    const nextAttribution = mergeAttribution(
      previousAttribution,
      extractAttribution(
        activeSearchParams,
        document.referrer || previousAttribution?.referrer || null
      )
    )

    if (hasAttributionParams(activeSearchParams) || !previousAttribution) {
      window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(nextAttribution))
    }

    setSessionId(nextSessionId)
    setAttribution(nextAttribution)

    postJsonInBackground("/api/analytics/session", {
      sessionId: nextSessionId,
      landingPath: currentPagePath,
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: navigator.userAgent,
      attribution: nextAttribution,
    })

    return nextSessionId
  }, [pathname])

  const trackEvent = useCallback(
    async (event: AnalyticsEventInput) => {
      const activeSessionId = sessionId ?? (await initializeSession())
      if (!activeSessionId) return

      postJsonInBackground("/api/analytics/event", {
        sessionId: activeSessionId,
        ...event,
      })
    },
    [initializeSession, sessionId]
  )

  useEffect(() => {
    void initializeSession()
  }, [initializeSession])

  useEffect(() => {
    if (!sessionId) return

    const activeSearchParams = new URLSearchParams(window.location.search)
    const pagePath = getPagePath(pathname, activeSearchParams)
    if (lastTrackedPage.current === pagePath) return

    lastTrackedPage.current = pagePath

    void trackEvent({
      type: "page_view",
      pagePath,
      metadata: {
        title: typeof document !== "undefined" ? document.title : null,
      },
    })
  }, [pathname, sessionId, trackEvent])

  const value = useMemo(
    () => ({
      sessionId,
      attribution,
      trackEvent,
    }),
    [attribution, sessionId, trackEvent]
  )

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)

  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider")
  }

  return context
}
