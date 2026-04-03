export type Produto = {
  id: string
  nome: string
  preco: number
  categoria: string
  imagem?: string
  permiteRecheios?: boolean
  disponivel?: boolean
  precoPromocional?: number | null
}

