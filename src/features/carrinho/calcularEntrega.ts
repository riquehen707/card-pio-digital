import { COORDENADAS_LOJA } from "@/lib/site"
import type { Coordenadas } from "@/types/carrinho"

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const raioTerraKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return raioTerraKm * c
}

function toRad(value: number) {
  return (value * Math.PI) / 180
}

export function calcularPrecoEntrega(destino: Coordenadas) {
  const distanciaKm = haversine(
    COORDENADAS_LOJA.lat,
    COORDENADAS_LOJA.lng,
    destino.lat,
    destino.lng
  )

  let preco = 0

  if (distanciaKm <= 1.5) {
    preco = 7
  } else if (distanciaKm <= 5) {
    preco = 8
  } else if (distanciaKm <= 8) {
    preco = 10
  } else {
    preco = 15
  }

  return {
    distanciaKm: parseFloat(distanciaKm.toFixed(2)),
    preco,
  }
}

