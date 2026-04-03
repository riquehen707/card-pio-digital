import "server-only"

import { Prisma } from "@/generated/prisma/client"

import { db } from "@/lib/db"

type GoogleAdsConfig = {
  developerToken: string
  clientId: string
  clientSecret: string
  refreshToken: string
  customerId: string
  loginCustomerId?: string
}

type GoogleAdsMetricRow = {
  campaignId: string
  campaignName: string
  day: string
  impressions: number
  clicks: number
  costMicros: bigint
  conversions: number
  conversionsValue: number
}

function serializeMetricRow(row: GoogleAdsMetricRow): Prisma.InputJsonObject {
  return {
    campaignId: row.campaignId,
    campaignName: row.campaignName,
    day: row.day,
    impressions: row.impressions,
    clicks: row.clicks,
    costMicros: row.costMicros.toString(),
    conversions: row.conversions,
    conversionsValue: row.conversionsValue,
  }
}

function getGoogleAdsConfig(): GoogleAdsConfig | null {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    return null
  }

  return {
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    customerId,
    loginCustomerId,
  }
}

async function getGoogleAccessToken(config: GoogleAdsConfig) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to refresh Google Ads token: ${text}`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

async function fetchGoogleAdsMetrics(config: GoogleAdsConfig, startDate: Date, endDate: Date) {
  const accessToken = await getGoogleAccessToken(config)
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'
      AND campaign.status != 'REMOVED'
  `

  const response = await fetch(
    `https://googleads.googleapis.com/v22/customers/${config.customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "developer-token": config.developerToken,
        ...(config.loginCustomerId ? { "login-customer-id": config.loginCustomerId } : {}),
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch Google Ads metrics: ${text}`)
  }

  const data = (await response.json()) as Array<{
    results?: Array<{
      campaign?: { id?: string; name?: string }
      segments?: { date?: string }
      metrics?: {
        impressions?: string | number
        clicks?: string | number
        costMicros?: string | number
        conversions?: string | number
        conversionsValue?: string | number
      }
    }>
  }>

  const rows: GoogleAdsMetricRow[] = []

  data.forEach((chunk) => {
    chunk.results?.forEach((result) => {
      const campaignId = result.campaign?.id
      const day = result.segments?.date

      if (!campaignId || !day) return

      rows.push({
        campaignId,
        campaignName: result.campaign?.name || "Campanha sem nome",
        day,
        impressions: Number(result.metrics?.impressions || 0),
        clicks: Number(result.metrics?.clicks || 0),
        costMicros: BigInt(result.metrics?.costMicros || 0),
        conversions: Number(result.metrics?.conversions || 0),
        conversionsValue: Number(result.metrics?.conversionsValue || 0),
      })
    })
  })

  return rows
}

export async function runGoogleAdsSync(daysBack = 30) {
  const config = getGoogleAdsConfig()

  if (!config) {
    return {
      ok: false,
      reason: "missing_config" as const,
      message: "Google Ads env vars are not configured.",
    }
  }

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - daysBack + 1)

  const syncRun = await db.syncRun.create({
    data: {
      provider: "google_ads",
      resource: "campaign_daily_metrics",
      status: "STARTED",
      details: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      },
    },
  })

  try {
    const rows = await fetchGoogleAdsMetrics(config, startDate, endDate)

    await db.$transaction(
      rows.map((row) =>
        db.googleAdsDailyMetric.upsert({
          where: {
            customerId_campaignId_day: {
              customerId: config.customerId,
              campaignId: row.campaignId,
              day: new Date(`${row.day}T00:00:00.000Z`),
            },
          },
          update: {
            campaignName: row.campaignName,
            impressions: row.impressions,
            clicks: row.clicks,
            costMicros: row.costMicros,
            conversions: row.conversions,
            conversionsValue: new Prisma.Decimal(row.conversionsValue),
            ctr: row.impressions > 0 ? row.clicks / row.impressions : 0,
            averageCpc:
              row.clicks > 0
                ? new Prisma.Decimal(Number(row.costMicros) / 1_000_000 / row.clicks)
                : null,
            rawPayload: serializeMetricRow(row),
          },
          create: {
            customerId: config.customerId,
            campaignId: row.campaignId,
            campaignName: row.campaignName,
            day: new Date(`${row.day}T00:00:00.000Z`),
            impressions: row.impressions,
            clicks: row.clicks,
            costMicros: row.costMicros,
            conversions: row.conversions,
            conversionsValue: new Prisma.Decimal(row.conversionsValue),
            ctr: row.impressions > 0 ? row.clicks / row.impressions : 0,
            averageCpc:
              row.clicks > 0
                ? new Prisma.Decimal(Number(row.costMicros) / 1_000_000 / row.clicks)
                : null,
            rawPayload: serializeMetricRow(row),
          },
        })
      )
    )

    await db.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        details: {
          rowsUpserted: rows.length,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        },
      },
    })

    return {
      ok: true,
      rowsUpserted: rows.length,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    await db.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message,
      },
    })

    throw error
  }
}
