'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CupomSalvo, ItemCarrinho, LocalizacaoSalva } from '@/types/carrinho'

type CarrinhoState = {
  hidratado: boolean
  itens: ItemCarrinho[]
  localizacaoFixa: LocalizacaoSalva | null
  cupom: CupomSalvo | null
  adicionarItem: (item: ItemCarrinho) => void
  removerItem: (index: number) => void
  limparCarrinho: () => void
  salvarLocalizacao: (localizacao: LocalizacaoSalva) => void
  limparLocalizacao: () => void
  aplicarCupom: (cupom: CupomSalvo) => void
  limparCupom: () => void
  marcarHidratado: () => void
}

export const useCarrinho = create<CarrinhoState>()(
  persist(
    (set) => ({
      hidratado: false,
      itens: [],
      localizacaoFixa: null,
      cupom: null,

      adicionarItem: (item) => {
        set((state) => ({ itens: [...state.itens, item] }))
      },

      removerItem: (index) => {
        set((state) => ({
          itens: state.itens.filter((_, currentIndex) => currentIndex !== index),
        }))
      },

      limparCarrinho: () => {
        set({ itens: [] })
      },

      salvarLocalizacao: (localizacao) => {
        set({ localizacaoFixa: localizacao })
      },

      limparLocalizacao: () => {
        set({ localizacaoFixa: null })
      },

      aplicarCupom: (cupom) => {
        set({ cupom })
      },

      limparCupom: () => {
        set({ cupom: null })
      },

      marcarHidratado: () => {
        set({ hidratado: true })
      },
    }),
    {
      name: 'acaraje-da-josi-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        itens: state.itens,
        localizacaoFixa: state.localizacaoFixa,
        cupom: state.cupom,
      }),
      onRehydrateStorage: () => (state) => {
        state?.marcarHidratado()
      },
    }
  )
)
