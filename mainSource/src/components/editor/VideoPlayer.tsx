import { useRef, useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useFilterStore } from '@/store/filterStore'
import { useOverlayStore } from '@/store/overlayStore'
import { useAudioStore } from '@/store/audioStore'
import { useTimelineStore } from '@/store/timelineStore'
import { buildFilterString } from '@/utils/filterUtils'
import { Upload } from 'lucide-react'
import FloatingActions from './FloatingActions'

interface VideoPlayerProps {
  onVideoUpload: (file: File) => void
}

export default function VideoPlayer({ onVideoUpload }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const { videoUrl, isPlaying, setIsPlaying, videoMetadata, loopEnabled } =
    useEditorStore(s => ({
      videoUrl: s.videoUrl,
      isPlaying: s.isPlaying,
      setIsPlaying: s.setIsPlaying,
      videoMetadata: s.videoMetadata,
      loopEnabled: s.loopEnabled
    }))
  const currentTime = useEditorStore(s => s.currentTime)
  const setCurrentTime = useEditorStore(s => s.setCurrentTime)
  const { speed, isMuted, volume } = usePlaybackStore()
  const { filterValues } = useFilterStore()
  const { textOverlays, stickerOverlays } = useOverlayStore()
  const { tracks: audioTracks } = useAudioStore()
  const { tracks: timelineTracks } = useTimelineStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const { canvasZoom } = useEditorStore()

  const scaleValue = canvasZoom === 'Fit' ? 1 : parseInt(canvasZoom.toString()) / 100

  // Find active video clip
  const videoTrack = timelineTracks.length > 0 ? timelineTracks[0] : null
  const activeClip = videoTrack?.clips.find(
    (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
  )

  // Canvas renderer loop
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeVideos = useRef<Map<string, HTMLVideoElement>>(new Map())
  const currentTimeRef = useRef(currentTime)
  
  useEffect(() => {
    return useEditorStore.subscribe((state) => {
      currentTimeRef.current = state.currentTime
    })
  }, [])

  useEffect(() => {
    if (!videoTrack) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const renderLoop = () => {
      const time = currentTimeRef.current
      // Find all clips that should be rendered at the current time
      // A clip is active if currentTime is within its duration OR
      // if it's the PREVIOUS clip and the current clip has a transition and we are in the transition phase.

      const clipsToRender: { clip: any; isTransitioning: boolean; progress: number }[] = []

      for (let i = 0; i < videoTrack.clips.length; i++) {
        const c = videoTrack.clips[i]
        const isActive = time >= c.startTime && time < c.startTime + c.duration

        // Is this the incoming clip with a transition?
        const isIncomingTransition = isActive && c.transition && (time - c.startTime) <= c.transition.duration

        if (isActive) {
          clipsToRender.push({
            clip: c,
            isTransitioning: !!isIncomingTransition,
            progress: isIncomingTransition ? (time - c.startTime) / c.transition!.duration : 1
          })
        }

        // Is this the previous clip that should hold its last frame during the transition?
        const nextClip = videoTrack.clips[i + 1]
        if (
          nextClip &&
          nextClip.transition &&
          time >= nextClip.startTime &&
          time <= nextClip.startTime + nextClip.transition.duration &&
          time >= c.startTime + c.duration
        ) {
          clipsToRender.push({
            clip: c,
            isTransitioning: true,
            progress: 1 - ((time - nextClip.startTime) / nextClip.transition.duration)
          })
        }
      }

      // Sync and render videos
      // 1. Manage pool
      const currentIds = new Set(clipsToRender.map(r => r.clip.id))
      activeVideos.current.forEach((v, id) => {
        if (!currentIds.has(id)) {
          v.pause()
          v.src = ''
          activeVideos.current.delete(id)
        }
      })

      // 2. Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Sort so previous clip draws first (underneath)
      clipsToRender.sort((a, b) => a.clip.startTime - b.clip.startTime).forEach(({ clip, isTransitioning, progress }) => {
        let v = activeVideos.current.get(clip.id)
        if (!v) {
          v = document.createElement('video')
          v.src = clip.source
          v.crossOrigin = 'anonymous'
          v.muted = isMuted 
          v.volume = volume * clip.volume
          v.playsInline = true
          v.play().catch(() => { })
          activeVideos.current.set(clip.id, v)
        }

        const expectedTime = Math.min((time - clip.startTime) * clip.speed + (clip.trimStart || 0), (clip.trimStart || 0) + clip.duration * clip.speed)

        if (Math.abs(v.currentTime - expectedTime) > 0.3) {
          v.currentTime = expectedTime
        }
        v.playbackRate = speed * clip.speed
        v.muted = isMuted
        v.volume = volume * clip.volume

        if (isPlaying && v.paused && expectedTime < clip.duration * clip.speed) {
          v.play().catch(() => { })
        } else if (!isPlaying && !v.paused) {
          v.pause()
        }

        if (v.readyState >= 2) {
          ctx.save()
          ctx.filter = buildFilterString(filterValues) || 'none'

          // Handle Transitions
          if (isTransitioning && clip.transition) {
            const tType = clip.transition.type
            if (tType === 'fade' || tType === 'dissolve') {
              ctx.globalAlpha = progress
            } else if (tType === 'slide') {
              ctx.translate(canvas.width * (progress - 1), 0)
            } else if (tType === 'zoom') {
              const scale = 0.5 + (0.5 * progress)
              ctx.translate(canvas.width / 2, canvas.height / 2)
              ctx.scale(scale, scale)
              ctx.translate(-canvas.width / 2, -canvas.height / 2)
              ctx.globalAlpha = progress
            }
          } else if (isTransitioning && progress < 1) { // This is the outgoing clip
            const incomingTransitionType = videoTrack.clips.find(c => c.startTime > clip.startTime)?.transition?.type
            if (incomingTransitionType === 'fade' || incomingTransitionType === 'dissolve') {
              ctx.globalAlpha = progress
            }
          }

          // Draw maintaining aspect ratio
          const vw = v.videoWidth || canvas.width
          const vh = v.videoHeight || canvas.height
          const scale = Math.min(canvas.width / vw, canvas.height / vh)
          const dx = (canvas.width - vw * scale) / 2
          const dy = (canvas.height - vh * scale) / 2
          ctx.drawImage(v, dx, dy, vw * scale, vh * scale)
          ctx.restore()
        }
      })

      // 3. Sync Audio (Video audio + External tracks)
      const activeExternalAudios = new Set()

      // External tracks
      audioTracks.forEach(track => {
        const isActive = time >= track.startTime && time < track.startTime + track.duration
        if (isActive) {
          activeExternalAudios.add(track.id)
          let a = audioRefs.current.get(track.id)
          if (!a) {
            a = new Audio(track.source)
            a.crossOrigin = 'anonymous'
            audioRefs.current.set(track.id, a)
          }

          const expectedTime = (time - track.startTime) + (track.trimStart || 0)
          if (Math.abs(a.currentTime - expectedTime) > 0.3) {
            a.currentTime = expectedTime
          }

          a.playbackRate = speed
          a.volume = isMuted || track.muted ? 0 : track.volume * volume

          if (isPlaying && a.paused) {
            a.play().catch(() => { })
          } else if (!isPlaying && !a.paused) {
            a.pause()
          }
        }
      })

      // Video tracks audio
      clipsToRender.forEach(({ clip, isTransitioning }) => {
        let a = audioRefs.current.get(clip.id)
        if (!a) {
          a = new Audio(clip.source)
          a.crossOrigin = 'anonymous'
          audioRefs.current.set(clip.id, a)
        }

        const expectedTime = Math.min((time - clip.startTime) * clip.speed + (clip.trimStart || 0), (clip.trimStart || 0) + clip.duration * clip.speed)
        if (Math.abs(a.currentTime - expectedTime) > 0.3) {
          a.currentTime = expectedTime
        }

        a.playbackRate = speed * clip.speed
        a.volume = isMuted ? 0 : clip.volume * volume

        if (isPlaying && a.paused && expectedTime < clip.duration * clip.speed) {
          a.play().catch(() => { })
        } else if (!isPlaying && !a.paused) {
          a.pause()
        }
      })

      // Cleanup unused audios
      const allActiveAudios = new Set([...clipsToRender.map(r => r.clip.id), ...activeExternalAudios])
      audioRefs.current.forEach((a, id) => {
        if (!allActiveAudios.has(id)) {
          a.pause()
          a.src = ''
          audioRefs.current.delete(id)
        }
      })

      animationFrameId = requestAnimationFrame(renderLoop)
    }

    animationFrameId = requestAnimationFrame(renderLoop)
    return () => {
      cancelAnimationFrame(animationFrameId)
      // Cleanup audio on unmount or deps change
      audioRefs.current.forEach((a) => {
        a.pause()
        a.src = ''
      })
      audioRefs.current.clear()
    }
  }, [videoTrack, audioTracks, isPlaying, speed, filterValues, isMuted, volume])

  // Simple playback time driver when no video element is driving it natively
  const lastTimeRef = useRef(performance.now())
  useEffect(() => {
    let frameId: number
    let lastUpdate = performance.now()
    const driveTime = () => {
      const now = performance.now()
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      if (isPlaying && videoTrack && videoTrack.clips.length > 0) {
        const nextTime = currentTimeRef.current + (dt * speed)
        
        // Loop logic
        const totalDuration = videoTrack.clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0)
        if (nextTime >= totalDuration) {
          if (loopEnabled) {
            currentTimeRef.current = 0
            setCurrentTime(0)
          } else {
            currentTimeRef.current = totalDuration
            setCurrentTime(totalDuration)
            setIsPlaying(false)
          }
        } else {
          currentTimeRef.current = nextTime
          // Batch/Throttle store update to 60fps or slightly less if needed, 
          // but we keep the Ref updated every frame for rendering.
          if (now - lastUpdate > 16) { // ~60fps
             setCurrentTime(nextTime)
             lastUpdate = now
          }
        }
      }
      frameId = requestAnimationFrame(driveTime)
    }
    lastTimeRef.current = performance.now()
    frameId = requestAnimationFrame(driveTime)
    return () => cancelAnimationFrame(frameId)
  }, [isPlaying, speed, videoTrack, loopEnabled, setIsPlaying, setCurrentTime])

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('video/')) onVideoUpload(f)
  }, [onVideoUpload])

  // Visible overlays at current time
  const visibleTexts = textOverlays.filter(
    (o) => currentTime >= o.startTime && currentTime <= o.startTime + o.duration
  )
  const visibleStickers = stickerOverlays.filter(
    (o) => currentTime >= o.startTime && currentTime <= o.startTime + o.duration
  )

  return (
    <div
      className="w-full h-full flex items-center justify-center relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {videoTrack && videoTrack.clips.length > 0 ? (
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `scale(${scaleValue})` }}
        >
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="max-w-full max-h-full object-contain rounded-sm shadow-md"
            onClick={() => setIsPlaying(!isPlaying)}
          />

          {/* Text overlays */}
          {visibleTexts.map((o) => (
            <div
              key={o.id}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${o.x}%`, top: `${o.y}%`,
                transform: `translate(-50%, -50%) rotate(${o.rotation}deg)`,
                fontSize: `${o.fontSize}px`, fontFamily: o.fontFamily,
                color: o.color, opacity: o.opacity,
                textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
                whiteSpace: 'nowrap',
              }}
            >
              {o.text}
            </div>
          ))}

          {/* Sticker overlays */}
          {visibleStickers.map((o) => (
            <div
              key={o.id}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${o.x}%`, top: `${o.y}%`,
                transform: `translate(-50%, -50%) rotate(${o.rotation}deg) scale(${o.scale})`,
                opacity: o.opacity, fontSize: '48px',
              }}
            >
              {o.src.startsWith('http') || o.src.startsWith('data:') ? (
                <img src={o.src} alt="sticker" className="w-16 h-16 object-contain" />
              ) : o.src}
            </div>
          ))}

          {/* Floating actions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <FloatingActions
              visible={true}
              onReplace={() => { }}
              onForward={() => { }}
              onBackward={() => { }}
              onDuplicate={() => { }}
              onDelete={() => { }}
              onFlipH={() => { }}
              onFlipV={() => { }}
            />
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center gap-3 transition-all ${isDragOver ? 'scale-105' : ''}`}>
          <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-accent bg-accent/5' : 'border-border'}`}>
            <Upload size={32} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {isDragOver ? 'Drop video here' : 'Drop a video to start editing'}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">MP4, WebM, or MOV</p>
          </div>
        </div>
      )}

      {isDragOver && videoTrack && videoTrack.clips.length > 0 && (
        <div className="absolute inset-0 bg-accent/10 border-2 border-dashed border-accent flex items-center justify-center z-30 rounded-md">
          <p className="text-sm font-medium text-accent">Drop to append video</p>
        </div>
      )}
    </div>
  )
}
