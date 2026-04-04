export type Coordenadas = {
  lat: number
  lng: number
}

export type ItemCarrinho = {
  id: string
  nome: string
  preco: number
  recheios?: string[]
}

export type LocalizacaoSalva = {
  coordenadas: Coordenadas
  link: string
  origem: "gps" | "manual"
  atualizadaEm: string
}
