import { create } from 'zustand'
import { FilterState } from '@/types'

interface FilterStoreState extends FilterState {
  addFilter: (filterType: string) => void
  removeFilter: (filterType: string) => void
  setFilterValue: (filterType: string, value: number) => void
  getFilterValue: (filterType: string) => number
  reset: () => void
}

const initialState: FilterState = {
  activeFilters: {},
  filterValues: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
  },
}

export const useFilterStore = create<FilterStoreState>((set, get) => ({
  ...initialState,

  addFilter: (filterType: string) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [filterType]: true },
    })),

  removeFilter: (filterType: string) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [filterType]: false },
    })),

  setFilterValue: (filterType: string, value: number) =>
    set((state) => ({
      filterValues: { ...state.filterValues, [filterType]: value },
    })),

  getFilterValue: (filterType: string) => {
    return get().filterValues[filterType] || 0
  },

  reset: () => set(initialState),
}))
