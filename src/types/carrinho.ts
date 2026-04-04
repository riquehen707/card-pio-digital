export type Coordenadas = {
  lat: number
  lng: number
}

export type MetodoPagamento = "pix" | "cartao" | "dinheiro"

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

export type PagamentoPedido = {
  metodo: MetodoPagamento
  precisaTroco?: boolean | null
  valorEntregue?: number | null
  trocoCalculado?: number | null
}
