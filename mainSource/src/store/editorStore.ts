import { create } from 'zustand'
import { VideoMetadata } from '@/types'
import { useTimelineStore } from './timelineStore'
import { useAudioStore } from './audioStore'
import { useOverlayStore } from './overlayStore'
import { useFilterStore } from './filterStore'

interface AppSnapshot {
  timeline: any
  audio: any
  overlay: any
  filter: any
}

export type ActiveTool = 'upload' | 'text' | 'sticker' | 'transition' | 'audio' | 'effects' | 'properties' | null

interface EditorStoreState {
  // Project
  currentProjectId: string | null
  videoMetadata: VideoMetadata | null
  videoFile: File | null
  videoUrl: string | null
  uploadedVideos: { id: string; file: File; url: string; metadata: VideoMetadata }[]

  // Tool & Panel state
  activeTool: ActiveTool
  sidePanelOpen: boolean
  searchQuery: string

  // Playback & Canvas
  isPlaying: boolean
  currentTime: number
  loopEnabled: boolean
  canvasZoom: string | number

  // Selection
  selectedTrackId: string | null
  selectedClipId: string | null
  selectedElementType: 'video' | 'audio' | 'text' | 'sticker' | null

  isTrimMode: boolean
  undoStack: AppSnapshot[]
  redoStack: AppSnapshot[]

  // Dialogs
  exportDialogOpen: boolean

  // Actions
  setVideoMetadata: (metadata: VideoMetadata) => void
  setVideoFile: (file: File | null, url: string | null) => void
  addUploadedVideo: (video: { id: string; file: File; url: string; metadata: VideoMetadata }) => void
  removeUploadedVideo: (id: string) => void
  setActiveTool: (tool: ActiveTool) => void
  setSidePanelOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setLoopEnabled: (enabled: boolean) => void
  setCanvasZoom: (zoom: string | number) => void
  setSelectedTrackId: (trackId: string | null) => void
  setSelectedClipId: (clipId: string | null) => void
  setSelectedElementType: (type: 'video' | 'audio' | 'text' | 'sticker' | null) => void
  setExportDialogOpen: (open: boolean) => void
  setIsTrimMode: (active: boolean) => void
  togglePlayback: () => void
  undo: () => void
  redo: () => void
  saveSnapshot: () => void
  reset: () => void
}

export const useEditorStore = create<EditorStoreState>((set) => ({
  currentProjectId: null,
  videoMetadata: null,
  videoFile: null,
  videoUrl: null,
  uploadedVideos: [],
  activeTool: null,
  sidePanelOpen: false,
  searchQuery: '',
  isPlaying: false,
  currentTime: 0,
  loopEnabled: false,
  canvasZoom: 'Fit',
  selectedTrackId: null,
  selectedClipId: null,
  selectedElementType: null,
  isTrimMode: false,
  undoStack: [],
  redoStack: [],
  exportDialogOpen: false,

  setVideoMetadata: (metadata) => set({ videoMetadata: metadata }),

  setVideoFile: (file, url) => set({ videoFile: file, videoUrl: url }),

  addUploadedVideo: (video) =>
    set((state) => ({ uploadedVideos: [...state.uploadedVideos, video] })),

  removeUploadedVideo: (id) =>
    set((state) => ({
      uploadedVideos: state.uploadedVideos.filter((v) => v.id !== id),
    })),

  setActiveTool: (tool) =>
    set((s) => {
      if (s.activeTool === tool) {
        return { activeTool: null, sidePanelOpen: false, searchQuery: '' }
      }
      return { activeTool: tool, sidePanelOpen: true, searchQuery: '' }
    }),

  setSidePanelOpen: (open) =>
    set({ sidePanelOpen: open, activeTool: open ? undefined : null, searchQuery: '' } as Partial<EditorStoreState>),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),

  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),

  setSelectedTrackId: (trackId) => set({ selectedTrackId: trackId }),

  setSelectedClipId: (clipId) => set({ selectedClipId: clipId }),

  setSelectedElementType: (type) => set({ selectedElementType: type }),

  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),

  setIsTrimMode: (active) => set({ isTrimMode: active }),

  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),

  undo: () =>
    set((s) => {
      if (s.undoStack.length === 0) return s
      const stack = [...s.undoStack]
      const snapshot = stack.pop()!

      const currentSnapshot: AppSnapshot = {
        timeline: { tracks: useTimelineStore.getState().tracks },
        audio: { tracks: useAudioStore.getState().tracks },
        overlay: { 
          textOverlays: useOverlayStore.getState().textOverlays,
          stickerOverlays: useOverlayStore.getState().stickerOverlays
        },
        filter: { filterValues: useFilterStore.getState().filterValues }
      }

      useTimelineStore.setState(snapshot.timeline)
      useAudioStore.setState(snapshot.audio)
      useOverlayStore.setState(snapshot.overlay)
      useFilterStore.setState(snapshot.filter)

      return { undoStack: stack, redoStack: [...s.redoStack, currentSnapshot] }
    }),

  redo: () =>
    set((s) => {
      if (s.redoStack.length === 0) return s
      const stack = [...s.redoStack]
      const snapshot = stack.pop()!

      const currentSnapshot: AppSnapshot = {
        timeline: { tracks: useTimelineStore.getState().tracks },
        audio: { tracks: useAudioStore.getState().tracks },
        overlay: { 
          textOverlays: useOverlayStore.getState().textOverlays,
          stickerOverlays: useOverlayStore.getState().stickerOverlays
        },
        filter: { filterValues: useFilterStore.getState().filterValues }
      }

      useTimelineStore.setState(snapshot.timeline)
      useAudioStore.setState(snapshot.audio)
      useOverlayStore.setState(snapshot.overlay)
      useFilterStore.setState(snapshot.filter)

      return { redoStack: stack, undoStack: [...s.undoStack, currentSnapshot] }
    }),

  saveSnapshot: () =>
    set((s) => {
      const snapshot: AppSnapshot = {
        timeline: { tracks: useTimelineStore.getState().tracks },
        audio: { tracks: useAudioStore.getState().tracks },
        overlay: { 
          textOverlays: useOverlayStore.getState().textOverlays,
          stickerOverlays: useOverlayStore.getState().stickerOverlays
        },
        filter: { filterValues: useFilterStore.getState().filterValues }
      }
      return { undoStack: [...s.undoStack, snapshot], redoStack: [] }
    }),

  reset: () =>
    set({
      currentProjectId: null,
      videoMetadata: null,
      videoFile: null,
      videoUrl: null,
      uploadedVideos: [],
      activeTool: null,
      sidePanelOpen: false,
      searchQuery: '',
      isPlaying: false,
      currentTime: 0,
      loopEnabled: false,
      selectedTrackId: null,
      selectedClipId: null,
      selectedElementType: null,
      isTrimMode: false,
      undoStack: [],
      redoStack: [],
      exportDialogOpen: false,
    }),
}))
