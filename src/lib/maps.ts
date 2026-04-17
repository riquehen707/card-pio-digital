import type { Coordenadas } from "@/types/carrinho"

const COORDENADAS_REGEX = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/

function coordenadasValidas(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

export function extrairCoordenadasDoLink(link: string): Coordenadas | null {
  const valor = link.trim()
  if (!valor) return null

  const padroes = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]sll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]daddr=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    COORDENADAS_REGEX,
  ]

  for (const regex of padroes) {
    const match = valor.match(regex)
    if (!match) continue

    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])

    if (coordenadasValidas(lat, lng)) {
      return { lat, lng }
    }
  }

  return null
}

export function criarLinkGoogleMaps({ lat, lng }: Coordenadas) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function formatarCoordenadas({ lat, lng }: Coordenadas) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
