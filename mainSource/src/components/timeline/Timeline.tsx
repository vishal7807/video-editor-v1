import { useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimelineStore } from '@/store/timelineStore'
import { useAudioStore } from '@/store/audioStore'
import { useOverlayStore } from '@/store/overlayStore'
import { useEditorStore } from '@/store/editorStore'
import {
  Play,
  Pause,
  Repeat,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Scissors,
  PlusCircle,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import TimelineClip from './TimelineClip'

const PX_PER_SEC_BASE = 80

export default function Timeline() {
  const { tracks, zoomLevel, setZoomLevel, addTrack, addClip } = useTimelineStore()
  const audioTracks = useAudioStore((s) => s.tracks)
  const { textOverlays, stickerOverlays } = useOverlayStore()
  const {
    videoMetadata,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    loopEnabled,
    setLoopEnabled,
    activeTool,
    setActiveTool,
  } = useEditorStore()

  const [collapsed, setCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const pxPerSec = PX_PER_SEC_BASE * zoomLevel
  const totalDuration = videoMetadata?.duration || 30
  const timelineWidth = totalDuration * pxPerSec

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = (s % 60).toFixed(1)
    return `${m}:${sec.padStart(4, '0')}`
  }

  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = Math.max(0, Math.min(totalDuration, x / pxPerSec))
      setCurrentTime(time)
      setIsPlaying(false)
    },
    [pxPerSec, totalDuration, setCurrentTime, setIsPlaying]
  )

  const handleTrackAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-clip]')) return
      const scrollLeft = scrollRef.current?.scrollLeft || 0
      const trackHeaderW = 90
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left - trackHeaderW + scrollLeft
      if (x < 0) return
      setCurrentTime(Math.max(0, Math.min(totalDuration, x / pxPerSec)))
    },
    [pxPerSec, totalDuration, setCurrentTime]
  )

  const handleAddClip = () => {
    setActiveTool('upload')
  }

  // Ruler marks
  const step = zoomLevel >= 2 ? 1 : zoomLevel >= 1 ? 2 : 5
  const rulerMarks: number[] = []
  for (let t = 0; t <= totalDuration; t += step) rulerMarks.push(t)

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        animate={{ height: collapsed ? 44 : 220 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="glass rounded-t-xl overflow-hidden flex flex-col shrink-0"
      >
        {/* ============ Top Controls ============ */}
        <div className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-border/50 relative">
          {/* Left: Background, Split */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium">Background</span>
            <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] hover:bg-muted transition-colors">
              <Scissors size={12} /> Split Clip
            </button>
          </div>

          {/* Center: Time + Play + Loop */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
            {/* Time (Left side) */}
            <div className="w-[120px] flex justify-end pr-3">
              <span className="text-[12px] text-foreground tabular-nums whitespace-nowrap">
                <TimeDisplay formatTime={formatTime} totalDuration={totalDuration} />
              </span>
            </div>

            {/* Play Button (Exact Center) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-muted/50 text-foreground transition-all duration-300 hover:shadow-md hover:shadow-accent/20 hover:bg-accent hover:text-white hover:border-accent cursor-pointer shrink-0"
                >
                  {isPlaying ? (
                    <Pause size={16} fill="currentColor" strokeWidth={1} />
                  ) : (
                    <Play size={16} fill="currentColor" strokeWidth={1} className="ml-0.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isPlaying ? 'Pause' : 'Play'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Loop Button (Right side) */}
            <div className="w-[120px] flex justify-start pl-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLoopEnabled(!loopEnabled)}
                    className={`icon-btn w-7 h-7 ${loopEnabled ? 'active' : ''}`}
                  >
                    <Repeat size={14} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{loopEnabled ? 'Disable Loop' : 'Enable Loop'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right: Zoom + Collapse */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-0 rounded-md border border-border overflow-hidden"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.2))}
                        className="icon-btn w-7 h-7 rounded-none"
                      >
                        <Minus size={12} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Reduce</p></TooltipContent>
                  </Tooltip>

                  <span className="text-[11px]  px-2 min-w-[36px] text-center border-x border-border">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.2))}
                        className="icon-btn w-7 h-7 rounded-none"
                      >
                        <Plus size={12} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Enlarge</p></TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="icon-btn w-7 h-7"
                >
                  {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{collapsed ? 'Expand Timeline' : 'Collapse Timeline'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ============ Track Area ============ */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
              onClick={handleTrackAreaClick}
            >
              {/* Ruler */}
              <div className="flex shrink-0 border-b border-border/30">
                <div className="w-[90px] shrink-0" />
                <div ref={scrollRef} className="flex-1 overflow-x-auto">
                  <div
                    className="h-5 relative cursor-pointer"
                    style={{ width: `${timelineWidth}px` }}
                    onClick={handleRulerClick}
                  >
                    {rulerMarks.map((t) => (
                      <div
                        key={t}
                        className="absolute top-0 h-full flex flex-col items-center"
                        style={{ left: `${t * pxPerSec}px` }}
                      >
                        <div className="h-1.5 w-px bg-muted-foreground/20" />
                        <span className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                          {Math.floor(t / 60)}:{String(Math.floor(t % 60)).padStart(2, '0')}
                        </span>
                      </div>
                    ))}

                    {/* Playhead triangle */}
                    <PlayheadTriangle pxPerSec={pxPerSec} />
                  </div>
                </div>
              </div>

              {/* Tracks */}
              <div className="flex-1 overflow-auto">
                {tracks.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground/50">No tracks yet — upload a video</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {tracks.map((track) => (
                      <div key={track.id} className="flex h-14 border-b border-border/10">
                        {/* Track label */}
                        <div className="w-[90px] shrink-0 px-2 flex items-center border-r border-border/20">
                          <span className="text-[10px] font-medium truncate text-muted-foreground">
                            {track.name}
                          </span>
                        </div>

                        {/* Track content */}
                        <div className="flex-1 relative overflow-x-auto">
                          <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                            {track.clips.map((clip) => (
                              <TimelineClip
                                key={clip.id}
                                item={clip}
                                type="video"
                                trackId={track.id}
                                pxPerSec={pxPerSec}
                              />
                            ))}

                            {/* Playhead line */}
                            <PlayheadLine pxPerSec={pxPerSec} />

                            {/* + Add Clip button at end */}
                            {track.clips.length > 0 && (
                              <button
                                onClick={handleAddClip}
                                className="absolute top-1 bottom-1 flex items-center gap-1 px-3 rounded-md bg-accent/10 hover:bg-accent/20 border border-dashed border-accent/30 text-accent text-[11px] font-medium transition-colors"
                                style={{
                                  left: `${Math.max(
                                    ...track.clips.map((c) => (c.startTime + c.duration) * pxPerSec),
                                    0
                                  ) + 8}px`,
                                }}
                              >
                                <PlusCircle size={14} />
                                Add Clip
                              </button>
                            )}

                            {track.clips.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                  onClick={handleAddClip}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 border border-dashed border-accent/30 text-accent text-[11px] font-medium transition-colors"
                                >
                                  <PlusCircle size={14} />
                                  Add Clip
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio Tracks */}
                {audioTracks.length > 0 && audioTracks.map((track) => (
                  <div key={track.id} className="flex h-14 border-b border-border/10">
                    <div className="w-[90px] shrink-0 px-2 flex items-center border-r border-border/20">
                      <span className="text-[10px] font-medium truncate text-green-500">
                        {track.name || 'Audio'}
                      </span>
                    </div>
                    <div className="flex-1 relative overflow-x-auto">
                      <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                        <TimelineClip
                          item={track}
                          type="audio"
                          pxPerSec={pxPerSec}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Text Track */}
                {textOverlays.length > 0 && (
                  <div className="flex h-14 border-b border-border/10">
                    <div className="w-[90px] shrink-0 px-2 flex items-center border-r border-border/20">
                      <span className="text-[10px] font-medium truncate text-purple-500">
                        Text
                      </span>
                    </div>
                    <div className="flex-1 relative overflow-x-auto">
                      <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                        {textOverlays.map((text) => (
                          <TimelineClip
                            key={text.id}
                            item={text}
                            type="text"
                            pxPerSec={pxPerSec}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticker Track */}
                {stickerOverlays.length > 0 && (
                  <div className="flex h-14 border-b border-border/10">
                    <div className="w-[90px] shrink-0 px-2 flex items-center border-r border-border/20">
                      <span className="text-[10px] font-medium truncate text-pink-500">
                        Stickers
                      </span>
                    </div>
                    <div className="flex-1 relative overflow-x-auto">
                      <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                        {stickerOverlays.map((sticker) => (
                          <TimelineClip
                            key={sticker.id}
                            item={sticker}
                            type="sticker"
                            pxPerSec={pxPerSec}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  )
}

function TimeDisplay({ formatTime, totalDuration }: { formatTime: (s: number) => string, totalDuration: number }) {
  const currentTime = useEditorStore(s => s.currentTime)
  return <>{formatTime(currentTime)} / {formatTime(totalDuration)}</>
}

function PlayheadTriangle({ pxPerSec }: { pxPerSec: number }) {
  const currentTime = useEditorStore(s => s.currentTime)
  return (
    <div
      className="absolute top-0 z-20 pointer-events-none"
      style={{ left: `${currentTime * pxPerSec}px` }}
    >
      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-accent -translate-x-1" />
    </div>
  )
}

function PlayheadLine({ pxPerSec }: { pxPerSec: number }) {
  const currentTime = useEditorStore(s => s.currentTime)
  return (
    <div
      className="absolute top-0 h-full w-px bg-accent/50 z-10 pointer-events-none"
      style={{ left: `${currentTime * pxPerSec}px` }}
    />
  )
}

