import "server-only"

import { db } from "@/lib/db"

function daysAgo(days: number) {
  const value = new Date()
  value.setHours(0, 0, 0, 0)
  value.setDate(value.getDate() - days)
  return value
}

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

function decimalToNumber(value: { toNumber(): number } | null | undefined) {
  return value ? value.toNumber() : 0
}

export async function getAdminDashboardData() {
  const last30Days = daysAgo(29)
  const last14Days = daysAgo(13)

  const [
    totalSessions,
    totalPageViews,
    totalProductAdds,
    totalLeads,
    leadRevenueAggregate,
    latestLeads,
    topProductRows,
    campaignRows,
    googleAdsCampaignRows,
    googleAdsDailyRows,
    recentLeadSeriesRows,
    latestSyncRun,
  ] = await Promise.all([
    db.visitorSession.count({
      where: {
        firstSeenAt: {
          gte: last30Days,
        },
      },
    }),
    db.analyticsEvent.count({
      where: {
        type: "page_view",
        createdAt: {
          gte: last30Days,
        },
      },
    }),
    db.analyticsEvent.count({
      where: {
        type: "product_add",
        createdAt: {
          gte: last30Days,
        },
      },
    }),
    db.lead.count({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
    }),
    db.lead.aggregate({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
      _sum: {
        total: true,
        deliveryFee: true,
      },
    }),
    db.lead.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      include: {
        items: true,
      },
    }),
    db.leadItem.findMany({
      where: {
        lead: {
          createdAt: {
            gte: last30Days,
          },
        },
      },
    }),
    db.lead.findMany({
      where: {
        createdAt: {
          gte: last30Days,
        },
      },
      select: {
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        total: true,
      },
    }),
    db.googleAdsDailyMetric.findMany({
      where: {
        day: {
          gte: last30Days,
        },
      },
    }),
    db.googleAdsDailyMetric.findMany({
      where: {
        day: {
          gte: last14Days,
        },
      },
      orderBy: {
        day: "asc",
      },
    }),
    db.lead.findMany({
      where: {
        createdAt: {
          gte: last14Days,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    }),
    db.syncRun.findFirst({
      orderBy: {
        startedAt: "desc",
      },
    }),
  ])

  const dayMap = new Map<
    string,
    {
      leads: number
      revenue: number
      adSpend: number
      adClicks: number
    }
  >()

  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = daysAgo(offset)
    dayMap.set(formatDay(day), {
      leads: 0,
      revenue: 0,
      adSpend: 0,
      adClicks: 0,
    })
  }

  recentLeadSeriesRows.forEach((lead) => {
    const key = formatDay(lead.createdAt)
    const bucket = dayMap.get(key)
    if (!bucket) return
    bucket.leads += 1
    bucket.revenue += decimalToNumber(lead.total)
  })

  googleAdsDailyRows.forEach((row) => {
    const key = formatDay(row.day)
    const bucket = dayMap.get(key)
    if (!bucket) return
    bucket.adSpend += Number(row.costMicros) / 1_000_000
    bucket.adClicks += row.clicks
  })

  const topProductsMap = new Map<
    string,
    {
      productId: string
      productName: string
      category: string | null
      quantity: number
      leadCount: number
      estimatedRevenue: number
    }
  >()

  topProductRows.forEach((row) => {
    const current = topProductsMap.get(row.productId)
    const revenue = row.quantity * decimalToNumber(row.unitPrice)

    if (current) {
      current.quantity += row.quantity
      current.leadCount += 1
      current.estimatedRevenue += revenue
      return
    }

    topProductsMap.set(row.productId, {
      productId: row.productId,
      productName: row.productName,
      category: row.category,
      quantity: row.quantity,
      leadCount: 1,
      estimatedRevenue: revenue,
    })
  })

  const campaignMap = new Map<
    string,
    {
      source: string
      medium: string
      campaign: string
      leads: number
      estimatedRevenue: number
    }
  >()

  campaignRows.forEach((row) => {
    const source = row.utmSource || "Direto / sem UTM"
    const medium = row.utmMedium || "-"
    const campaign = row.utmCampaign || "-"
    const key = `${source}::${medium}::${campaign}`
    const current = campaignMap.get(key)

    if (current) {
      current.leads += 1
      current.estimatedRevenue += decimalToNumber(row.total)
      return
    }

    campaignMap.set(key, {
      source,
      medium,
      campaign,
      leads: 1,
      estimatedRevenue: decimalToNumber(row.total),
    })
  })

  const googleAdsCampaignMap = new Map<
    string,
    {
      campaignId: string
      campaignName: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      conversionsValue: number
    }
  >()

  googleAdsCampaignRows.forEach((row) => {
    const current = googleAdsCampaignMap.get(row.campaignId)
    const spend = Number(row.costMicros) / 1_000_000

    if (current) {
      current.impressions += row.impressions
      current.clicks += row.clicks
      current.spend += spend
      current.conversions += row.conversions
      current.conversionsValue += decimalToNumber(row.conversionsValue)
      return
    }

    googleAdsCampaignMap.set(row.campaignId, {
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      impressions: row.impressions,
      clicks: row.clicks,
      spend,
      conversions: row.conversions,
      conversionsValue: decimalToNumber(row.conversionsValue),
    })
  })

  const googleAdsCampaigns = Array.from(googleAdsCampaignMap.values()).sort((a, b) => b.spend - a.spend)

  const googleAdsTotals = googleAdsCampaigns.reduce(
    (acc, row) => {
      acc.impressions += row.impressions
      acc.clicks += row.clicks
      acc.spend += row.spend
      acc.conversions += row.conversions
      acc.conversionsValue += row.conversionsValue
      return acc
    },
    {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      conversionsValue: 0,
    }
  )

  return {
    summary: {
      totalSessions,
      totalPageViews,
      totalProductAdds,
      totalLeads,
      estimatedRevenue: decimalToNumber(leadRevenueAggregate._sum.total),
      totalDeliveryFees: decimalToNumber(leadRevenueAggregate._sum.deliveryFee),
      googleAdsSpend: googleAdsTotals.spend,
      googleAdsClicks: googleAdsTotals.clicks,
      googleAdsImpressions: googleAdsTotals.impressions,
      googleAdsConversions: googleAdsTotals.conversions,
      googleAdsConversionValue: googleAdsTotals.conversionsValue,
    },
      latestLeads: latestLeads.map((lead) => ({
      id: lead.id,
      createdAt: lead.createdAt,
      total: decimalToNumber(lead.total),
      utmCampaign: lead.utmCampaign,
      gclid: lead.gclid,
      itemCount: lead.items.reduce((acc, item) => acc + item.quantity, 0),
      locationUrl: lead.locationUrl,
      items: lead.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
      })),
    })),
    topProducts: Array.from(topProductsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8),
    campaigns: Array.from(campaignMap.values())
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8),
    googleAdsCampaigns: googleAdsCampaigns.slice(0, 8),
    dailySeries: Array.from(dayMap.entries()).map(([day, metrics]) => ({
      day,
      ...metrics,
    })),
    latestSyncRun: latestSyncRun
      ? {
          status: latestSyncRun.status,
          startedAt: latestSyncRun.startedAt,
          finishedAt: latestSyncRun.finishedAt,
          errorMessage: latestSyncRun.errorMessage,
        }
      : null,
  }
}
