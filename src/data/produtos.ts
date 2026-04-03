import type { Produto } from "@/types/produto"

export const produtos: Produto[] = [
  {
    id: "acaraje",
    nome: "Acaraje",
    preco: 15,
    categoria: "Comidas",
    imagem: "/images/acaraje.jpeg",
    permiteRecheios: true,
  },
  {
    id: "abara",
    nome: "Abara",
    preco: 15,
    categoria: "Comidas",
    imagem: "/images/abara.jpg",
    permiteRecheios: true,
  },
  {
    id: "acaraje-gigante",
    nome: "Acaraje Gigante",
    preco: 40,
    categoria: "Comidas",
    imagem: "/images/acaraje-gigante.jpg",
    permiteRecheios: true,
  },
  {
    id: "coca-lata",
    nome: "Coca-Cola (lata)",
    preco: 5,
    categoria: "Bebidas",
    imagem: "/images/cocacolalata.jpeg",
  },
  {
    id: "pepsi-lata",
    nome: "Pepsi (lata)",
    preco: 5,
    categoria: "Bebidas",
    imagem: "/images/pepsilata.jpeg",
  },
  {
    id: "guarana-lata",
    nome: "Guarana Antartica (lata)",
    preco: 5,
    categoria: "Bebidas",
    imagem: "/images/guarana-antartica.jpeg",
  },
  {
    id: "coca-1l",
    nome: "Coca-Cola (1L)",
    preco: 8,
    categoria: "Bebidas",
    imagem: "/images/cocacola1l.jpeg",
  },
  {
    id: "pepsi-1l",
    nome: "Pepsi (1L)",
    preco: 8,
    categoria: "Bebidas",
    imagem: "/images/pepsi1l.jpg",
  },
  {
    id: "guarana-1l",
    nome: "Guarana Antartica (1L)",
    preco: 8,
    categoria: "Bebidas",
    imagem: "/images/guarana1l.jpeg",
  },
  {
    id: "heineken-longneck",
    nome: "Heineken Long Neck (330 ml)",
    preco: 10,
    categoria: "Bebidas",
  },
  {
    id: "itaipava-latao-550ml",
    nome: "Itaipava Latao 550 ml",
    preco: 9,
    categoria: "Bebidas",
  },
  {
    id: "amstel-lata-350ml",
    nome: "Amstel (lata 350 ml)",
    preco: 8,
    categoria: "Bebidas",
  },
]

