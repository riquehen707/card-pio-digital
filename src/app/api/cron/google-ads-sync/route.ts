import { NextResponse } from "next/server"

import { runGoogleAdsSync } from "@/lib/google-ads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runGoogleAdsSync()
  return NextResponse.json(result)
}

