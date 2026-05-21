import { create } from 'zustand'
import { OverlayState, TextOverlay, StickerOverlay } from '@/types'

interface OverlayStoreState extends OverlayState {
  addTextOverlay: (overlay: TextOverlay) => void
  removeTextOverlay: (id: string) => void
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void
  addStickerOverlay: (overlay: StickerOverlay) => void
  removeStickerOverlay: (id: string) => void
  updateStickerOverlay: (id: string, updates: Partial<StickerOverlay>) => void
  setSelectedOverlayId: (id: string | null) => void
  getTextOverlay: (id: string) => TextOverlay | undefined
  getStickerOverlay: (id: string) => StickerOverlay | undefined
  reset: () => void
}

const initialState: OverlayState = {
  textOverlays: [],
  stickerOverlays: [],
  selectedOverlayId: null,
}

export const useOverlayStore = create<OverlayStoreState>((set, get) => ({
  ...initialState,

  addTextOverlay: (overlay: TextOverlay) =>
    set((state) => ({
      textOverlays: [...state.textOverlays, overlay],
    })),

  removeTextOverlay: (id: string) =>
    set((state) => ({
      textOverlays: state.textOverlays.filter((o) => o.id !== id),
    })),

  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) =>
    set((state) => ({
      textOverlays: state.textOverlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay,
      ),
    })),

  addStickerOverlay: (overlay: StickerOverlay) =>
    set((state) => ({
      stickerOverlays: [...state.stickerOverlays, overlay],
    })),

  removeStickerOverlay: (id: string) =>
    set((state) => ({
      stickerOverlays: state.stickerOverlays.filter((o) => o.id !== id),
    })),

  updateStickerOverlay: (id: string, updates: Partial<StickerOverlay>) =>
    set((state) => ({
      stickerOverlays: state.stickerOverlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay,
      ),
    })),

  setSelectedOverlayId: (id: string | null) =>
    set({ selectedOverlayId: id }),

  getTextOverlay: (id: string) => {
    return get().textOverlays.find((o) => o.id === id)
  },

  getStickerOverlay: (id: string) => {
    return get().stickerOverlays.find((o) => o.id === id)
  },

  reset: () => set(initialState),
}))
