import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTimelineStore } from '@/store/timelineStore'
import { useAudioStore } from '@/store/audioStore'
import { useOverlayStore } from '@/store/overlayStore'
import { useEditorStore } from '@/store/editorStore'
import { Scissors, Trash2, ArrowUp, ArrowDown, Copy, Type, Smile, Music, Film } from 'lucide-react'

interface TimelineElementProps {
  item: any // Clip | AudioTrack | TextOverlay | StickerOverlay
  type: 'video' | 'audio' | 'text' | 'sticker'
  trackId?: string // Only for video
  pxPerSec: number
}

export default function TimelineClip({ item, type, trackId, pxPerSec }: TimelineElementProps) {
  const { snapEnabled } = useTimelineStore()
  const { 
    selectedClipId, setSelectedClipId, setSelectedTrackId, setSelectedElementType, 
    saveSnapshot, setActiveTool, setSidePanelOpen 
  } = useEditorStore()

  const [dragState, setDragState] = useState<{
    type: 'move' | 'trimStart' | 'trimEnd'
    startX: number
    origStart: number
    origDuration: number
  } | null>(null)
  const [hovered, setHovered] = useState(false)

  const isSelected = selectedClipId === item.id
  const width = Math.max(24, item.duration * pxPerSec)
  const left = item.startTime * pxPerSec

  const updateItem = useCallback((updates: any) => {
    if (type === 'video' && trackId) useTimelineStore.getState().updateClip(trackId, item.id, updates)
    if (type === 'audio') useAudioStore.getState().updateAudioTrack(item.id, updates)
    if (type === 'text') useOverlayStore.getState().updateTextOverlay(item.id, updates)
    if (type === 'sticker') useOverlayStore.getState().updateStickerOverlay(item.id, updates)
  }, [type, trackId, item.id])

  const removeItem = useCallback(() => {
    if (type === 'video' && trackId) useTimelineStore.getState().removeClip(trackId, item.id)
    if (type === 'audio') useAudioStore.getState().removeAudioTrack(item.id)
    if (type === 'text') useOverlayStore.getState().removeTextOverlay(item.id)
    if (type === 'sticker') useOverlayStore.getState().removeStickerOverlay(item.id)
  }, [type, trackId, item.id])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    setSelectedClipId(item.id)
    setSelectedTrackId(trackId || null)
    setSelectedElementType(type)
    
    // Open appropriate panel
    if (type === 'video') setActiveTool('properties')
    if (type === 'audio') setActiveTool('audio')
    if (type === 'text') setActiveTool('text')
    if (type === 'sticker') setActiveTool('sticker')
    setSidePanelOpen(true)
  }, [item.id, trackId, type, setSelectedClipId, setSelectedTrackId, setSelectedElementType, setActiveTool, setSidePanelOpen])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, dragType: 'move' | 'trimStart' | 'trimEnd') => {
      e.stopPropagation()
      e.preventDefault()
      setDragState({
        type: dragType,
        startX: e.clientX,
        origStart: item.startTime,
        origDuration: item.duration,
      })
    },
    [item.startTime, item.duration]
  )

  useEffect(() => {
    if (!dragState) return
    
    // Gather snap points (basic implementation for now)
    const snapPoints: number[] = [0, useEditorStore.getState().currentTime]
    const snapRadius = 0.2 // seconds

    const snapTime = (time: number) => {
      if (!snapEnabled) return time
      let snapped = time
      let minDiff = snapRadius
      for (const pt of snapPoints) {
        if (Math.abs(time - pt) < minDiff) {
          minDiff = Math.abs(time - pt)
          snapped = pt
        }
      }
      return Math.max(0, snapped)
    }

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX
      const dt = dx / pxPerSec
      
      if (dragState.type === 'move') {
        const rawTime = Math.max(0, dragState.origStart + dt)
        const snappedTime = snapTime(rawTime)
        updateItem({ startTime: snappedTime })
      } else if (dragState.type === 'trimStart') {
        const rawTime = Math.max(0, dragState.origStart + dt)
        const snappedTime = snapTime(rawTime)
        const trim = snappedTime - dragState.origStart
        const clampedTrim = Math.min(dragState.origDuration - 0.1, trim)
        updateItem({
          startTime: dragState.origStart + clampedTrim,
          duration: dragState.origDuration - clampedTrim,
          trimStart: (item.trimStart || 0) + clampedTrim,
        })
      } else {
        const rawEnd = dragState.origStart + dragState.origDuration + dt
        const snappedEnd = snapTime(rawEnd)
        updateItem({ duration: Math.max(0.1, snappedEnd - dragState.origStart) })
      }
    }
    const onUp = () => {
      if (dragState.type !== 'move' || Math.abs(dragState.origStart - item.startTime) > 0.01) {
        saveSnapshot()
      }
      setDragState(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragState, pxPerSec, item.id, updateItem, snapEnabled])

  // We don't listen to currentTime reactively here to avoid re-renders.
  // canSplit check is moved inside handleSplit.
  
  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation()
    const currentPos = useEditorStore.getState().currentTime
    const isOver = currentPos > item.startTime + 0.05 && currentPos < item.startTime + item.duration - 0.05
    if (!isOver || !trackId) return
    
    const relTime = currentPos - item.startTime
    updateItem({ duration: relTime })
    useTimelineStore.getState().addClip(trackId, {
      ...item,
      id: `clip-${Date.now()}`,
      startTime: currentPos,
      duration: item.duration - relTime,
    })
    saveSnapshot()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeItem()
    if (isSelected) { setSelectedClipId(null); setSelectedTrackId(null) }
    saveSnapshot()
  }

  let bgClass = ''
  let label = ''
  let Icon = Film
  if (type === 'video') { bgClass = 'bg-accent/20 border-accent/30 hover:bg-accent/30'; label = item.name || 'Video'; Icon = Film }
  if (type === 'audio') { bgClass = 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'; label = item.name || 'Audio'; Icon = Music }
  if (type === 'text') { bgClass = 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30'; label = item.text || 'Text'; Icon = Type }
  if (type === 'sticker') { bgClass = 'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30'; label = 'Sticker'; Icon = Smile }

  return (
    <div
      data-clip
      className={`absolute top-1 bottom-1 rounded-md border cursor-grab select-none transition-shadow duration-100 ${
        dragState ? 'z-50 cursor-grabbing' : 'z-10'
      } ${
        isSelected
          ? 'bg-primary/40 border-primary shadow-md shadow-primary/20'
          : bgClass
      }`}
      style={{ left: `${left}px`, width: `${width}px`, minWidth: '24px' }}
      onPointerDown={handlePointerDown}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left trim */}
      <div
        className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize z-20 group"
        onMouseDown={(e) => handleMouseDown(e, 'trimStart')}
      >
        <div className="absolute inset-y-1 left-px w-px bg-white/0 group-hover:bg-white/50 rounded transition-colors" />
      </div>

      {/* Right trim */}
      <div
        className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize z-20 group"
        onMouseDown={(e) => handleMouseDown(e, 'trimEnd')}
      >
        <div className="absolute inset-y-1 right-px w-px bg-white/0 group-hover:bg-white/50 rounded transition-colors" />
      </div>

      {/* Clip label */}
      <div className="absolute inset-0 px-2 flex items-center overflow-hidden pointer-events-none gap-1">
        <Icon size={10} className="text-white/70 shrink-0" />
        <span className="text-[10px] font-medium text-white/80 truncate">
          {label}
        </span>
      </div>

      {/* Hover/Selected floating actions */}
      {(hovered || isSelected) && (
        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-0.5 p-0.5 rounded-md bg-card border border-border shadow-md z-30"
        >
          {type === 'video' && (
            <button onClick={handleSplit} className="icon-btn w-5 h-5" title="Split">
              <Scissors size={10} />
            </button>
          )}
          <button onClick={handleDelete} className="icon-btn w-5 h-5 hover:!bg-destructive/20 hover:!text-destructive" title="Delete">
            <Trash2 size={10} />
          </button>
        </motion.div>
      )}

      {/* Info tooltip when selected */}
      {isSelected && (
        <div className="absolute -bottom-5 left-0 text-[8px] bg-card/90 px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap pointer-events-none border border-border/30 z-30">
          {item.startTime.toFixed(1)}s → {(item.startTime + item.duration).toFixed(1)}s
        </div>
      )}
    </div>
  )
}
