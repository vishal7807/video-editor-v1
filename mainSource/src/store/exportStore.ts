import { create } from 'zustand'
import { ExportState } from '@/types'

interface ExportStoreState extends ExportState {
  setIsExporting: (isExporting: boolean) => void
  setExportProgress: (progress: number) => void
  setExportQuality: (quality: 'low' | 'medium' | 'high') => void
  setExportFormat: (format: 'mp4' | 'webm') => void
  setExportResolution: (resolution: '720p' | '1080p') => void
  reset: () => void
}

const initialState: ExportState = {
  isExporting: false,
  exportProgress: 0,
  exportQuality: 'medium',
  exportFormat: 'mp4',
  exportResolution: '1080p',
}

export const useExportStore = create<ExportStoreState>((set) => ({
  ...initialState,

  setIsExporting: (isExporting: boolean) =>
    set({ isExporting }),

  setExportProgress: (progress: number) =>
    set({ exportProgress: Math.max(0, Math.min(100, progress)) }),

  setExportQuality: (quality: 'low' | 'medium' | 'high') =>
    set({ exportQuality: quality }),

  setExportFormat: (format: 'mp4' | 'webm') =>
    set({ exportFormat: format }),

  setExportResolution: (resolution: '720p' | '1080p') =>
    set({ exportResolution: resolution }),

  reset: () => set(initialState),
}))
