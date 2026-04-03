import { NextResponse } from "next/server"

import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import type { AnalyticsEventInput } from "@/types/analytics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type EventPayload = AnalyticsEventInput & {
  sessionId?: string
}

function normalizeString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export async function POST(request: Request) {
  const body = (await request.json()) as EventPayload
  const sessionId = normalizeString(body.sessionId)
  const type = normalizeString(body.type)

  if (!sessionId || !type) {
    return NextResponse.json({ error: "sessionId and type are required" }, { status: 400 })
  }

  await db.analyticsEvent.create({
    data: {
      sessionId,
      type,
      pagePath: normalizeString(body.pagePath),
      productId: normalizeString(body.productId),
      productName: normalizeString(body.productName),
      value:
        typeof body.value === "number" && Number.isFinite(body.value)
          ? new Prisma.Decimal(body.value)
          : null,
      metadata: body.metadata ? (body.metadata as Prisma.InputJsonValue) : undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
