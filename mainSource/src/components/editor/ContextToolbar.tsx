import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useFilterStore } from '@/store/filterStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useAudioStore } from '@/store/audioStore'
import {
  Scissors, Volume2, VolumeX, Gauge, Crop, Sparkles, Palette, Eye, Move,
  Replace, Type, Bold, Italic, Paintbrush, Film, LayoutGrid, X,
  ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react'

interface ToolbarItem {
  id: string
  icon: typeof Scissors
  label: string
  hasPopup?: boolean
}

const VIDEO_ITEMS: ToolbarItem[] = [
  { id: 'shape', icon: LayoutGrid, label: 'Shape', hasPopup: true },
  { id: 'video', icon: Film, label: 'Video', hasPopup: true },
  { id: 'trim', icon: Scissors, label: 'Trim' },
  { id: 'volume', icon: Volume2, label: 'Volume', hasPopup: true },
  { id: 'speed', icon: Gauge, label: '1.0×', hasPopup: true },
  { id: 'crop', icon: Crop, label: 'Crop' },
  { id: 'animations', icon: Sparkles, label: 'Animations' },
  { id: 'style', icon: Palette, label: 'Style' },
  { id: 'opacity', icon: Eye, label: 'Opacity', hasPopup: true },
  { id: 'position', icon: Move, label: 'Position', hasPopup: true },
]

const AUDIO_ITEMS: ToolbarItem[] = [
  { id: 'replace', icon: Replace, label: 'Replace' },
  { id: 'trim', icon: Scissors, label: 'Trim' },
  { id: 'volume', icon: Volume2, label: 'Volume', hasPopup: true },
  { id: 'speed', icon: Gauge, label: '1.0×', hasPopup: true },
  { id: 'position', icon: Move, label: 'Position', hasPopup: true },
]

const TEXT_ITEMS: ToolbarItem[] = [
  { id: 'font', icon: Type, label: 'Font' },
  { id: 'bold', icon: Bold, label: 'Bold' },
  { id: 'italic', icon: Italic, label: 'Italic' },
  { id: 'color', icon: Paintbrush, label: 'Color' },
  { id: 'opacity', icon: Eye, label: 'Opacity', hasPopup: true },
  { id: 'position', icon: Move, label: 'Position', hasPopup: true },
]

const STICKER_ITEMS: ToolbarItem[] = [
  { id: 'replace', icon: Replace, label: 'Replace' },
  { id: 'opacity', icon: Eye, label: 'Opacity', hasPopup: true },
  { id: 'position', icon: Move, label: 'Position', hasPopup: true },
]

function getItemsForType(type: string | null): ToolbarItem[] {
  switch (type) {
    case 'audio': return AUDIO_ITEMS
    case 'text': return TEXT_ITEMS
    case 'sticker': return STICKER_ITEMS
    default: return VIDEO_ITEMS
  }
}

export default function ContextToolbar() {
  const { selectedClipId, selectedElementType, isTrimMode, setIsTrimMode, setSidePanelOpen } = useEditorStore()
  const [activePopup, setActivePopup] = useState<string | null>(null)

  if (isTrimMode) return null

  if (!selectedClipId && !selectedElementType) return null

  const items = getItemsForType(selectedElementType || 'video')

  const handleItemClick = (item: ToolbarItem) => {
    if (item.hasPopup) {
      setActivePopup(activePopup === item.id ? null : item.id)
    } else if (item.id === 'trim') {
      setIsTrimMode(true)
      setSidePanelOpen(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="context-toolbar mx-auto w-fit relative"
      >
        {items.map((item) => (
          <div key={item.id} className="relative">
            <button
              className={`context-toolbar-btn ${activePopup === item.id ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <item.icon size={14} strokeWidth={1.8} />
              <span>{item.id === 'speed' ? `${usePlaybackStore.getState().speed}×` : item.label}</span>
            </button>

            {/* Popups */}
            <AnimatePresence>
              {activePopup === item.id && (item.id === 'shape' || item.id === 'video') && (
                <CommentPopup
                  title={item.label}
                  onClose={() => setActivePopup(null)}
                />
              )}
              {activePopup === item.id && item.id === 'volume' && (
                <VolumePopup onClose={() => setActivePopup(null)} />
              )}
              {activePopup === item.id && item.id === 'speed' && (
                <SpeedPopup onClose={() => setActivePopup(null)} />
              )}
              {activePopup === item.id && item.id === 'opacity' && (
                <OpacityPopup onClose={() => setActivePopup(null)} />
              )}
              {activePopup === item.id && item.id === 'position' && (
                <PositionPopup onClose={() => setActivePopup(null)} />
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

/* =================== Volume Popup =================== */
function VolumePopup({ onClose }: { onClose: () => void }) {
  const { selectedClipId, selectedTrackId, selectedElementType, saveSnapshot } = useEditorStore()
  const { getClip, updateClip } = useTimelineStore()
  const { tracks: audioTracks, updateAudioTrack } = useAudioStore()
  const { volume: globalVolume, setVolume: setGlobalVolume, isMuted: globalMuted, setIsMuted: setGlobalMuted } = usePlaybackStore()

  let currentVolume = globalVolume
  let isMuted = globalMuted

  if (selectedElementType === 'video' && selectedTrackId && selectedClipId) {
    const clip = getClip(selectedTrackId, selectedClipId)
    if (clip) {
      currentVolume = clip.volume
      isMuted = clip.volume === 0
    }
  } else if (selectedElementType === 'audio' && selectedClipId) {
    const track = audioTracks.find(t => t.id === selectedClipId)
    if (track) {
      currentVolume = track.volume
      isMuted = track.muted
    }
  }

  const handleMuteToggle = () => {
    if (selectedElementType === 'video' && selectedTrackId && selectedClipId) {
      const clip = getClip(selectedTrackId, selectedClipId)
      if (clip) updateClip(selectedTrackId, selectedClipId, { volume: clip.volume > 0 ? 0 : 1 })
    } else if (selectedElementType === 'audio' && selectedClipId) {
      const track = audioTracks.find(t => t.id === selectedClipId)
      if (track) updateAudioTrack(selectedClipId, { muted: !track.muted })
    } else {
      setGlobalMuted(!globalMuted)
    }
    saveSnapshot()
  }

  const handleVolumeChange = (val: number) => {
    if (selectedElementType === 'video' && selectedTrackId && selectedClipId) {
      updateClip(selectedTrackId, selectedClipId, { volume: val })
    } else if (selectedElementType === 'audio' && selectedClipId) {
      updateAudioTrack(selectedClipId, { volume: val, muted: val === 0 })
    } else {
      setGlobalVolume(val)
      if (globalMuted && val > 0) setGlobalMuted(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg bg-card border border-border shadow-lg z-50 w-52"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium">Volume</span>
        <button onClick={onClose} className="icon-btn w-5 h-5"><X size={10} /></button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleMuteToggle}
          className={`icon-btn w-7 h-7 ${isMuted ? 'text-destructive' : ''}`}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : currentVolume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          onMouseUp={() => saveSnapshot()}
          onTouchEnd={() => saveSnapshot()}
          className="flex-1"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
          {isMuted ? '0' : Math.round(currentVolume * 100)}%
        </span>
      </div>
    </motion.div>
  )
}

/* =================== Speed Popup =================== */
function SpeedPopup({ onClose }: { onClose: () => void }) {
  const { selectedClipId, selectedTrackId, saveSnapshot } = useEditorStore()
  const { getClip, updateClip } = useTimelineStore()
  const { speed: globalSpeed, setSpeed: setGlobalSpeed } = usePlaybackStore()
  const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2]

  const clip = selectedTrackId && selectedClipId ? getClip(selectedTrackId, selectedClipId) : null
  const currentSpeed = clip ? clip.speed : globalSpeed

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg bg-card border border-border shadow-lg z-50 w-44"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium">Speed</span>
        <button onClick={onClose} className="icon-btn w-5 h-5"><X size={10} /></button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => {
              if (clip && selectedTrackId && selectedClipId) {
                updateClip(selectedTrackId, selectedClipId, { speed: s })
              } else {
                setGlobalSpeed(s)
              }
              saveSnapshot()
            }}
            className={`px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${currentSpeed === s
                ? 'bg-accent/20 text-accent'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/* =================== Opacity Popup =================== */
function OpacityPopup({ onClose }: { onClose: () => void }) {
  const [opacity, setOpacity] = useState(100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg bg-card border border-border shadow-lg z-50 w-48"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium">Opacity</span>
        <button onClick={onClose} className="icon-btn w-5 h-5"><X size={10} /></button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(parseInt(e.target.value))}
          className="flex-1"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{opacity}%</span>
      </div>
    </motion.div>
  )
}

/* =================== Position Popup =================== */
function PositionPopup({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg bg-card border border-border shadow-lg z-50 w-48"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium">Move Head</span>
        <button onClick={onClose} className="icon-btn w-5 h-5"><X size={10} /></button>
      </div>
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 text-[10px] transition-colors">
            <ArrowUp size={12} /> Forward
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 text-[10px] transition-colors">
            <ArrowDown size={12} /> Backward
          </button>
        </div>
        <div className="flex gap-1.5">
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 text-[10px] transition-colors">
            <ArrowUpToLine size={12} /> Front
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 text-[10px] transition-colors">
            <ArrowDownToLine size={12} /> Back
          </button>
        </div>
      </div>
    </motion.div>
  )
}
/* =================== Comment Popup =================== */
function CommentPopup({ title, onClose }: { title: string; onClose: () => void }) {
  const [comment, setComment] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg bg-card border border-border shadow-lg z-50 w-56"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium">{title} Comment</span>
        <button onClick={onClose} className="icon-btn w-5 h-5"><X size={10} /></button>
      </div>
      <div className="space-y-2">
        <textarea
          className="w-full p-2 text-[10px] bg-muted/30 rounded-md border border-border focus:outline-none focus:border-accent/50 resize-none h-16"
          placeholder={`Add a comment to this ${title.toLowerCase()}...`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          onClick={onClose}
          className="w-full py-1.5 bg-accent text-white text-[10px] font-medium rounded-md hover:bg-accent/90"
        >
          Save Comment
        </button>
      </div>
    </motion.div>
  )
}
