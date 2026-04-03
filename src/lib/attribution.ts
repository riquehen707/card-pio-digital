import type { AttributionSnapshot } from "@/types/analytics"

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const

export const ANALYTICS_SESSION_KEY = "acj_analytics_session"
export const ATTRIBUTION_STORAGE_KEY = "acj_analytics_attribution"

export function getPagePath(pathname: string, searchParams: URLSearchParams | null) {
  const query = searchParams?.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function extractAttribution(searchParams: URLSearchParams, referrer?: string | null): AttributionSnapshot {
  return {
    utmSource: searchParams.get("utm_source"),
    utmMedium: searchParams.get("utm_medium"),
    utmCampaign: searchParams.get("utm_campaign"),
    utmTerm: searchParams.get("utm_term"),
    utmContent: searchParams.get("utm_content"),
    gclid: searchParams.get("gclid"),
    gbraid: searchParams.get("gbraid"),
    wbraid: searchParams.get("wbraid"),
    fbclid: searchParams.get("fbclid"),
    referrer: referrer ?? null,
  }
}

export function mergeAttribution(
  previous: AttributionSnapshot | null,
  next: AttributionSnapshot
): AttributionSnapshot {
  return {
    utmSource: next.utmSource || previous?.utmSource || null,
    utmMedium: next.utmMedium || previous?.utmMedium || null,
    utmCampaign: next.utmCampaign || previous?.utmCampaign || null,
    utmTerm: next.utmTerm || previous?.utmTerm || null,
    utmContent: next.utmContent || previous?.utmContent || null,
    gclid: next.gclid || previous?.gclid || null,
    gbraid: next.gbraid || previous?.gbraid || null,
    wbraid: next.wbraid || previous?.wbraid || null,
    fbclid: next.fbclid || previous?.fbclid || null,
    referrer: next.referrer || previous?.referrer || null,
  }
}

export function hasAttributionParams(searchParams: URLSearchParams) {
  return ATTRIBUTION_KEYS.some((key) => searchParams.has(key))
}

