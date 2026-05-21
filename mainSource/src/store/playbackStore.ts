import { create } from 'zustand'
import { PlaybackState } from '@/types'

interface PlaybackStoreState extends PlaybackState {
  setSpeed: (speed: number) => void
  setIsMuted: (isMuted: boolean) => void
  setVolume: (volume: number) => void
  reset: () => void
}

const initialState: PlaybackState = {
  speed: 1,
  isMuted: false,
  volume: 1,
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  ...initialState,

  setSpeed: (speed: number) =>
    set({ speed: Math.max(0.5, Math.min(2, speed)) }),

  setIsMuted: (isMuted: boolean) =>
    set({ isMuted }),

  setVolume: (volume: number) =>
    set({ volume: Math.max(0, Math.min(1, volume)) }),

  reset: () => set(initialState),
}))
