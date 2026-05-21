import { create } from 'zustand'
import { TimelineState, Track, Clip } from '@/types'

interface TimelineStoreState extends TimelineState {
  addTrack: (track: Track) => void
  removeTrack: (trackId: string) => void
  addClip: (trackId: string, clip: Clip) => void
  removeClip: (trackId: string, clipId: string) => void
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void
  setZoomLevel: (zoomLevel: number) => void
  setSnapEnabled: (snapEnabled: boolean) => void
  setPlayheadPosition: (position: number) => void
  getClip: (trackId: string, clipId: string) => Clip | undefined
  getTrack: (trackId: string) => Track | undefined
  reset: () => void
}

const initialState: TimelineState = {
  tracks: [],
  zoomLevel: 1,
  snapEnabled: true,
  playheadPosition: 0,
}

export const useTimelineStore = create<TimelineStoreState>((set, get) => ({
  ...initialState,

  addTrack: (track: Track) =>
    set((state) => ({
      tracks: [...state.tracks, track],
    })),

  removeTrack: (trackId: string) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
    })),

  addClip: (trackId: string, clip: Clip) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, clip] }
          : track,
      ),
    })),

  removeClip: (trackId: string, clipId: string) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, clips: track.clips.filter((c) => c.id !== clipId) }
          : track,
      ),
    })),

  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === clipId ? { ...clip, ...updates } : clip,
              ),
            }
          : track,
      ),
    })),

  setZoomLevel: (zoomLevel: number) =>
    set({ zoomLevel }),

  setSnapEnabled: (snapEnabled: boolean) =>
    set({ snapEnabled }),

  setPlayheadPosition: (position: number) =>
    set({ playheadPosition: position }),

  getClip: (trackId: string, clipId: string) => {
    const state = get()
    const track = state.tracks.find((t) => t.id === trackId)
    return track?.clips.find((c) => c.id === clipId)
  },

  getTrack: (trackId: string) => {
    const state = get()
    return state.tracks.find((t) => t.id === trackId)
  },

  reset: () => set(initialState),
}))
