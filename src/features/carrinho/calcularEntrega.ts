import { COORDENADAS_LOJA } from "@/lib/site"
import type { Coordenadas } from "@/types/carrinho"

const TAXA_BASE = 5.5
const DISTANCIA_BASE_KM = 1
const DISTANCIA_MEDIA_KM = 6
const VALOR_POR_KM_MEDIO = 0.9
const VALOR_POR_KM_LONGE = 1.05
const VALOR_POR_KM_MUITO_LONGE = 0.5
const DISTANCIA_MAXIMA_COM_ACRESCIMO_KM = 10

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

function arredondarParaMeioReal(value: number) {
  return Math.round(value * 2) / 2
}

export function calcularPrecoEntrega(destino: Coordenadas) {
  const distanciaKm = haversine(
    COORDENADAS_LOJA.lat,
    COORDENADAS_LOJA.lng,
    destino.lat,
    destino.lng
  )

  const distanciaMedia = Math.max(
    0,
    Math.min(distanciaKm, DISTANCIA_MEDIA_KM) - DISTANCIA_BASE_KM
  )
  const distanciaLonga = Math.max(
    0,
    Math.min(distanciaKm, DISTANCIA_MAXIMA_COM_ACRESCIMO_KM) - DISTANCIA_MEDIA_KM
  )
  const distanciaMuitoLonga = Math.max(0, distanciaKm - DISTANCIA_MAXIMA_COM_ACRESCIMO_KM)

  const precoBruto =
    TAXA_BASE +
    distanciaMedia * VALOR_POR_KM_MEDIO +
    distanciaLonga * VALOR_POR_KM_LONGE +
    distanciaMuitoLonga * VALOR_POR_KM_MUITO_LONGE

  const preco = arredondarParaMeioReal(precoBruto)

  return {
    distanciaKm: parseFloat(distanciaKm.toFixed(2)),
    preco: parseFloat(preco.toFixed(2)),
  }
}
