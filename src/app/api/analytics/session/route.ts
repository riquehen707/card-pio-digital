import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import type { AttributionSnapshot } from "@/types/analytics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SessionPayload = {
  sessionId?: string
  landingPath?: string
  locale?: string
  timezone?: string
  userAgent?: string
  attribution?: AttributionSnapshot
}

function normalizeString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export async function POST(request: Request) {
  const body = (await request.json()) as SessionPayload
  const sessionId = normalizeString(body.sessionId)

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const attribution = body.attribution ?? {}

  await db.visitorSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      landingPath: normalizeString(body.landingPath),
      locale: normalizeString(body.locale),
      timezone: normalizeString(body.timezone),
      userAgent: normalizeString(body.userAgent),
      referrer: normalizeString(attribution.referrer),
      utmSource: normalizeString(attribution.utmSource),
      utmMedium: normalizeString(attribution.utmMedium),
      utmCampaign: normalizeString(attribution.utmCampaign),
      utmTerm: normalizeString(attribution.utmTerm),
      utmContent: normalizeString(attribution.utmContent),
      gclid: normalizeString(attribution.gclid),
      gbraid: normalizeString(attribution.gbraid),
      wbraid: normalizeString(attribution.wbraid),
      fbclid: normalizeString(attribution.fbclid),
    },
    update: {
      landingPath: normalizeString(body.landingPath) ?? undefined,
      locale: normalizeString(body.locale) ?? undefined,
      timezone: normalizeString(body.timezone) ?? undefined,
      userAgent: normalizeString(body.userAgent) ?? undefined,
      referrer: normalizeString(attribution.referrer) ?? undefined,
      utmSource: normalizeString(attribution.utmSource) ?? undefined,
      utmMedium: normalizeString(attribution.utmMedium) ?? undefined,
      utmCampaign: normalizeString(attribution.utmCampaign) ?? undefined,
      utmTerm: normalizeString(attribution.utmTerm) ?? undefined,
      utmContent: normalizeString(attribution.utmContent) ?? undefined,
      gclid: normalizeString(attribution.gclid) ?? undefined,
      gbraid: normalizeString(attribution.gbraid) ?? undefined,
      wbraid: normalizeString(attribution.wbraid) ?? undefined,
      fbclid: normalizeString(attribution.fbclid) ?? undefined,
      lastSeenAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, sessionId })
}

