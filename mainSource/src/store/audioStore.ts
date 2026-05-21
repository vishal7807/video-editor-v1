import { create } from 'zustand'
import { AudioState, AudioTrack } from '@/types'

interface AudioStoreState extends AudioState {
  addAudioTrack: (track: AudioTrack) => void
  removeAudioTrack: (trackId: string) => void
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void
  setSelectedAudioTrackId: (trackId: string | null) => void
  getAudioTrack: (trackId: string) => AudioTrack | undefined
  reset: () => void
}

const initialState: AudioState = {
  tracks: [],
  selectedAudioTrackId: null,
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  ...initialState,

  addAudioTrack: (track: AudioTrack) =>
    set((state) => ({
      tracks: [...state.tracks, track],
    })),

  removeAudioTrack: (trackId: string) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
    })),

  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, ...updates } : track,
      ),
    })),

  setSelectedAudioTrackId: (trackId: string | null) =>
    set({ selectedAudioTrackId: trackId }),

  getAudioTrack: (trackId: string) => {
    return get().tracks.find((t) => t.id === trackId)
  },

  reset: () => set(initialState),
}))
