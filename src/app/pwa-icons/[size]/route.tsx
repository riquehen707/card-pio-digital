import { ImageResponse } from "next/og"

export const runtime = "edge"

function getDimension(rawSize: string) {
  const size = Number.parseInt(rawSize, 10)
  return [180, 192, 512].includes(size) ? size : null
}

function patternRow(size: number, top: number, inverted = false) {
  const colors = inverted
    ? ["#F8DCA2", "#5A3028", "#E9471D", "#F8DCA2", "#5A3028", "#E9471D"]
    : ["#E9471D", "#F8DCA2", "#5A3028", "#E9471D", "#F8DCA2", "#5A3028"]
  const blockWidth = size / 6
  const blockHeight = size * 0.08

  return colors.map((color, index) => (
    <div
      key={`${top}-${index}-${color}`}
      style={{
        position: "absolute",
        left: index * blockWidth,
        top,
        width: blockWidth,
        height: blockHeight,
        background: color,
      }}
    />
  ))
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

  const stripeHeight = size * 0.08
  const innerInset = size * 0.08
  const monogramSize = size >= 512 ? 156 : size >= 192 ? 62 : 58
  const labelSize = size >= 512 ? 42 : size >= 192 ? 16 : 14

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5A82F",
          position: "relative",
          overflow: "hidden",
          color: "#4B241D",
          fontFamily: "Georgia, serif",
        }}
      >
        {patternRow(size, 0)}
        {patternRow(size, stripeHeight, true)}
        {patternRow(size, size - stripeHeight * 2)}
        {patternRow(size, size - stripeHeight, true)}

        <div
          style={{
            position: "absolute",
            inset: innerInset,
            borderRadius: size * 0.18,
            border: "3px solid rgba(92,40,23,0.16)",
            background:
              "radial-gradient(circle at top left, rgba(255,231,176,0.4), transparent 26%), linear-gradient(180deg, rgba(247,173,62,0.98), rgba(241,159,38,0.98))",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: size * 0.02,
          }}
        >
          <div
            style={{
              fontSize: monogramSize,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            AJ
          </div>
          <div
            style={{
              width: size * 0.18,
              height: Math.max(6, size * 0.018),
              borderRadius: 999,
              background: "#E9471D",
            }}
          />
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: labelSize,
              textTransform: "uppercase",
              letterSpacing: size >= 512 ? 8 : 3,
              fontWeight: 700,
              color: "#E9471D",
            }}
          >
            Josi
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
