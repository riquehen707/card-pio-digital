import { NextResponse } from "next/server"

import { Prisma } from "@/generated/prisma/client"
import { getCatalogProductById } from "@/lib/catalog"
import { db } from "@/lib/db"
import { groupOrderItems } from "@/lib/order-formatting"
import { generateOrderReference, normalizeOrderReference } from "@/lib/order-reference"
import type { LeadCheckoutInput } from "@/types/analytics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function normalizeString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export async function POST(request: Request) {
  const body = (await request.json()) as LeadCheckoutInput

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items are required" }, { status: 400 })
  }

  if (!isFiniteNumber(body.subtotal) || !isFiniteNumber(body.deliveryFee) || !isFiniteNumber(body.total)) {
    return NextResponse.json({ error: "subtotal, deliveryFee and total are required" }, { status: 400 })
  }

  const groupedItems = groupOrderItems(
    body.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      category: item.category ?? null,
      fillings: item.fillings ?? [],
    }))
  )

  if (groupedItems.length === 0) {
    return NextResponse.json({ error: "items are required" }, { status: 400 })
  }

  const orderReference = normalizeOrderReference(body.orderReference) ?? generateOrderReference()

  const session = body.sessionId
    ? await db.visitorSession.findUnique({
        where: { id: body.sessionId },
      })
    : null

  const lead = await db.lead.create({
    data: {
      sessionId: normalizeString(body.sessionId),
      whatsappNumber: normalizeString(body.whatsappNumber),
      subtotal: new Prisma.Decimal(body.subtotal),
      deliveryFee: new Prisma.Decimal(body.deliveryFee),
      total: new Prisma.Decimal(body.total),
      locationUrl: normalizeString(body.locationUrl),
      latitude: isFiniteNumber(body.latitude) ? body.latitude : null,
      longitude: isFiniteNumber(body.longitude) ? body.longitude : null,
      utmSource: session?.utmSource ?? null,
      utmMedium: session?.utmMedium ?? null,
      utmCampaign: session?.utmCampaign ?? null,
      utmTerm: session?.utmTerm ?? null,
      utmContent: session?.utmContent ?? null,
      gclid: session?.gclid ?? null,
      gbraid: session?.gbraid ?? null,
      wbraid: session?.wbraid ?? null,
      fbclid: session?.fbclid ?? null,
      rawPayload: { ...body, orderReference } as Prisma.InputJsonValue,
      items: {
        create: groupedItems.map((item) => {
          const produto = getCatalogProductById(item.productId)
          const unitPrice = item.unitPrice ?? 0
          return {
            productId: item.productId,
            productName: item.productName,
            category: item.category ?? produto?.categoria ?? null,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(unitPrice),
            fillings: item.fillings.length > 0 ? (item.fillings as Prisma.InputJsonValue) : undefined,
          }
        }),
      },
    },
  })

  return NextResponse.json({ ok: true, leadId: lead.id, orderReference })
}
