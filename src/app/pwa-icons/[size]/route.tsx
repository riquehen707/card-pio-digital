import { ImageResponse } from "next/og"

import { SITE_NAME } from "@/lib/site"

export const runtime = "edge"

function getDimension(rawSize: string) {
  const size = Number.parseInt(rawSize, 10)
  return [180, 192, 512].includes(size) ? size : null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await context.params
  const size = getDimension(rawSize)

  if (!size) {
    return new Response("Not found", { status: 404 })
  }

  const fontSize = size >= 512 ? 74 : size >= 192 ? 28 : 24
  const badgeSize = size >= 512 ? 148 : size >= 192 ? 64 : 58

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(183,86,24,0.96), rgba(145,59,18,1) 46%, rgba(87,127,53,0.92) 100%)",
          color: "#fffaf0",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: size * 0.08,
            borderRadius: size * 0.22,
            border: "3px solid rgba(255,255,255,0.25)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: size * 0.04,
          }}
        >
          <div
            style={{
              display: "flex",
              height: badgeSize,
              width: badgeSize,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: badgeSize / 2,
              background: "rgba(255,255,255,0.18)",
              fontSize: badgeSize * 0.52,
            }}
          >
            A
          </div>
          <div
            style={{
              display: "flex",
              fontSize,
              fontWeight: 700,
              letterSpacing: size >= 512 ? 2 : 1,
              textTransform: "uppercase",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
