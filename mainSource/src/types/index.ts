// Video and Project Types
export interface VideoMetadata {
  duration: number
  fps: number
  width: number
  height: number
  url: string
}

export interface Clip {
  id: string
  trackId: string
  startTime: number
  trimStart: number
  duration: number
  source: string
  name?: string
  speed: number
  volume: number
  transition?: {
    type: string
    duration: number
  }
}

export interface Track {
  id: string
  clips: Clip[]
  name: string
  opacity: number
  muted: boolean
}

// Overlay Types
export interface TextOverlay {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  rotation: number
  opacity: number
  startTime: number
  duration: number
}

export interface StickerOverlay {
  id: string
  name?: string
  src: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  startTime: number
  duration: number
}

// Transition Type
export interface Transition {
  id: string
  type: 'fade' | 'slide' | 'dissolve' | 'wipeLeft' | 'wipeRight'
  duration: number
  clipId: string
}

// Audio Track Type
export interface AudioTrack {
  id: string
  name?: string
  source: string
  startTime: number
  trimStart: number
  duration: number
  volume: number
  muted: boolean
}

// Filter Type
export interface Filter {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale' | 'hueRotate' | 'invert'
  value: number
}

// Export Settings
export interface ExportSettings {
  format: 'mp4' | 'webm'
  quality: 'low' | 'medium' | 'high'
  resolution: '720p' | '1080p'
  audioEnabled: boolean
}

// Editor State Types
export interface EditorState {
  currentProjectId: string | null
  videoMetadata: VideoMetadata | null
  isPlaying: boolean
  currentTime: number
  selectedTrackId: string | null
  selectedClipId: string | null
  undoStack: any[]
  redoStack: any[]
}

export interface TimelineState {
  tracks: Track[]
  zoomLevel: number
  snapEnabled: boolean
  playheadPosition: number
}

export interface PlaybackState {
  speed: number
  isMuted: boolean
  volume: number
}

export interface OverlayState {
  textOverlays: TextOverlay[]
  stickerOverlays: StickerOverlay[]
  selectedOverlayId: string | null
}

export interface FilterState {
  activeFilters: Record<string, boolean>
  filterValues: Record<string, number>
}

export interface AudioState {
  tracks: AudioTrack[]
  selectedAudioTrackId: string | null
}

export interface ExportState {
  isExporting: boolean
  exportProgress: number
  exportQuality: 'low' | 'medium' | 'high'
  exportFormat: 'mp4' | 'webm'
  exportResolution: '720p' | '1080p'
}
