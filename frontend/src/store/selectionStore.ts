import { create } from 'zustand'

interface SelectionStore {
  selectedId: string | null
  selectedType: 'element' | 'wire' | null
  select: (id: string, type: 'element' | 'wire') => void
  deselect: () => void
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedId: null,
  selectedType: null,
  select: (id, type) => set({ selectedId: id, selectedType: type }),
  deselect: () => set({ selectedId: null, selectedType: null }),
}))
