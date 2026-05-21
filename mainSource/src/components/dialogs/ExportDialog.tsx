import { useRef, useState } from 'react'
import { useExportStore } from '@/store/exportStore'
import { useEditorStore } from '@/store/editorStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useAudioStore } from '@/store/audioStore'
import { useOverlayStore } from '@/store/overlayStore'
import { useFilterStore } from '@/store/filterStore'
import { buildFilterString } from '@/utils/filterUtils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: () => Promise<void>
}

type ExportPhase = 'settings' | 'exporting' | 'done' | 'error'

export default function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const {
    exportFormat,
    exportResolution,
    exportQuality,
    setExportFormat,
    setExportResolution,
    setExportQuality,
  } = useExportStore()

  const { videoUrl, videoMetadata } = useEditorStore()
  const { tracks } = useTimelineStore()

  const [phase, setPhase] = useState<ExportPhase>('settings')
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const cancelledRef = useRef(false)

  const handleExport = async () => {
    const { tracks: audioTracks } = useAudioStore.getState()
    const { filterValues } = useFilterStore.getState()
    const { textOverlays, stickerOverlays } = useOverlayStore.getState()
    const videoClips = tracks.length > 0 ? tracks[0].clips : []

    if (videoClips.length === 0) {
      toast.error('No video loaded in timeline')
      return
    }

    setPhase('exporting')
    setProgress(0)
    cancelledRef.current = false
    chunksRef.current = []

    try {
      const resMap: Record<string, [number, number]> = { '720p': [1280, 720], '1080p': [1920, 1080] }
      const [w, h] = resMap[exportResolution] || [1280, 720]

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!

      // Total Duration
      const totalDuration = videoClips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0)

      // Audio setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const destNode = audioCtx.createMediaStreamDestination()

      const activeVideos = new Map<string, { video: HTMLVideoElement, sourceNode: MediaElementAudioSourceNode }>()
      const activeAudios = new Map<string, { audio: HTMLAudioElement, sourceNode: MediaElementAudioSourceNode }>()

      // Pre-create Audio elements for audio tracks
      audioTracks.forEach(t => {
        const a = new Audio(t.source)
        a.crossOrigin = 'anonymous'
        a.volume = t.muted ? 0 : t.volume
        const node = audioCtx.createMediaElementSource(a)
        node.connect(destNode)
        activeAudios.set(t.id, { audio: a, sourceNode: node })
      })

      // Pre-load sticker images
      const stickerImages = new Map<string, HTMLImageElement>()
      stickerOverlays.forEach(o => {
        if (o.src.startsWith('data:') || o.src.startsWith('http')) {
          const img = new Image()
          img.src = o.src
          stickerImages.set(o.id, img)
        }
      })

      // We only capture video from canvas + mixed audio
      const canvasStream = canvas.captureStream(30)
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destNode.stream.getAudioTracks()
      ])

      const mimeType = exportFormat === 'mp4' ? 'video/webm' : 'video/webm' // Browsers usually fallback to webm
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: exportQuality === 'high' ? 8000000 : exportQuality === 'medium' ? 4000000 : 2000000,
      })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        if (cancelledRef.current) return
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setPhase('done')
        toast.success('Export complete!')
      }

      recorder.start(100)
      
      const startTime = performance.now()
      
      const renderFrame = () => {
        if (cancelledRef.current) {
          recorder.stop()
          activeVideos.forEach(v => { v.video.pause(); v.sourceNode.disconnect() })
          activeAudios.forEach(a => { a.audio.pause(); a.sourceNode.disconnect() })
          audioCtx.close()
          return
        }

        const now = (performance.now() - startTime) / 1000
        
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, w, h)

        // Find current video clip
        const clip = videoClips.find(c => now >= c.startTime && now < c.startTime + c.duration)
        
        if (clip) {
          let vData = activeVideos.get(clip.id)
          if (!vData) {
            const video = document.createElement('video')
            video.src = clip.source
            video.crossOrigin = 'anonymous'
            video.muted = false // we route it through audio context
            video.volume = clip.volume
            video.playbackRate = clip.speed
            video.play().catch(() => {})
            const node = audioCtx.createMediaElementSource(video)
            node.connect(destNode)
            vData = { video, sourceNode: node }
            activeVideos.set(clip.id, vData)
          }

          const expectedTime = (now - clip.startTime) * clip.speed
          if (Math.abs(vData.video.currentTime - expectedTime) > 0.5) {
            vData.video.currentTime = expectedTime
          }

          if (vData.video.paused) vData.video.play().catch(() => {})

          // Apply filters
          ctx.filter = buildFilterString(filterValues) || 'none'
          
          // Draw maintaining aspect ratio
          const vw = vData.video.videoWidth || w
          const vh = vData.video.videoHeight || h
          const scale = Math.min(w / vw, h / vh)
          const dx = (w - vw * scale) / 2
          const dy = (h - vh * scale) / 2
          ctx.drawImage(vData.video, dx, dy, vw * scale, vh * scale)
          ctx.filter = 'none'
        }

        // Cleanup unused videos
        activeVideos.forEach((vData, id) => {
          if (!clip || clip.id !== id) {
            vData.video.pause()
            vData.sourceNode.disconnect()
            activeVideos.delete(id)
          }
        })

        // Audio track sync
        audioTracks.forEach(t => {
          const aData = activeAudios.get(t.id)
          if (aData) {
            const isInRange = now >= t.startTime && now <= t.startTime + t.duration
            if (isInRange) {
              const expectedTime = now - t.startTime
              if (Math.abs(aData.audio.currentTime - expectedTime) > 0.5) {
                aData.audio.currentTime = expectedTime
              }
              if (aData.audio.paused) aData.audio.play().catch(() => {})
            } else {
              aData.audio.pause()
            }
          }
        })

        // Text overlays
        textOverlays.forEach(o => {
          if (now >= o.startTime && now <= o.startTime + o.duration) {
            ctx.save()
            ctx.translate((o.x / 100) * w, (o.y / 100) * h)
            ctx.rotate((o.rotation * Math.PI) / 180)
            ctx.globalAlpha = o.opacity
            ctx.font = `${o.fontSize}px ${o.fontFamily}`
            ctx.fillStyle = o.color
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(o.text, 0, 0)
            ctx.restore()
          }
        })

        // Sticker overlays
        stickerOverlays.forEach(o => {
          if (now >= o.startTime && now <= o.startTime + o.duration) {
            ctx.save()
            ctx.translate((o.x / 100) * w, (o.y / 100) * h)
            ctx.rotate((o.rotation * Math.PI) / 180)
            ctx.globalAlpha = o.opacity
            
            if (o.src.startsWith('data:') || o.src.startsWith('http')) {
              const img = stickerImages.get(o.id)
              if (img && img.complete) {
                const imgW = 128 * o.scale // Approximate native sticker size
                const imgH = 128 * o.scale
                ctx.drawImage(img, -imgW/2, -imgH/2, imgW, imgH)
              }
            } else {
               ctx.font = `${64 * o.scale}px sans-serif`
               ctx.textAlign = 'center'
               ctx.textBaseline = 'middle'
               ctx.fillText(o.src, 0, 0)
            }
            ctx.restore()
          }
        })

        // Progress
        const pct = Math.min(100, (now / totalDuration) * 100)
        setProgress(pct)

        if (now >= totalDuration) {
          recorder.stop()
          activeVideos.forEach(v => { v.video.pause(); v.sourceNode.disconnect() })
          activeAudios.forEach(a => { a.audio.pause(); a.sourceNode.disconnect() })
          audioCtx.close()
          return
        }

        requestAnimationFrame(renderFrame)
      }
      requestAnimationFrame(renderFrame)
    } catch (err) {
      console.error('Export failed:', err)
      setPhase('error')
      toast.error('Export failed. Try a different format.')
    }
  }

  const handleCancel = () => {
    cancelledRef.current = true
    recorderRef.current?.stop()
    setPhase('settings')
    setProgress(0)
    toast.info('Export cancelled')
  }

  const handleDownload = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `video-export.${exportFormat === 'mp4' ? 'webm' : 'webm'}`
    a.click()
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      if (phase === 'exporting') {
        handleCancel()
      }
      setPhase('settings')
      setProgress(0)
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
        setDownloadUrl(null)
      }
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
        </DialogHeader>

        {phase === 'settings' && (
          <div className="space-y-5">
            {(!tracks || tracks.length === 0 || tracks[0].clips.length === 0) && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle size={16} className="text-destructive" />
                <p className="text-xs text-destructive">No video loaded. Upload a video first.</p>
              </div>
            )}

            {/* Format */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['mp4', 'webm'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      exportFormat === fmt
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Resolution</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['720p', '1080p'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setExportResolution(res)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      exportResolution === res
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Quality</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setExportQuality(q)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all capitalize ${
                      exportQuality === q
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={!tracks || tracks.length === 0 || tracks[0].clips.length === 0}
                className="flex-1 gap-2"
              >
                <Download size={16} />
                Export
              </Button>
            </div>
          </div>
        )}

        {phase === 'exporting' && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="animate-pulse-soft text-sm font-medium">Rendering video...</div>
              <p className="text-xs text-muted-foreground">This may take a moment</p>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
            <Button variant="outline" onClick={handleCancel} className="w-full gap-2">
              <X size={16} />
              Cancel Export
            </Button>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Export Complete!</p>
              <p className="text-xs text-muted-foreground">Your video is ready to download</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={handleDownload} className="flex-1 gap-2">
                <Download size={16} />
                Download
              </Button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4 py-4 text-center">
            <AlertCircle size={48} className="mx-auto text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Export Failed</p>
              <p className="text-xs text-muted-foreground">
                Try a different format or check your video file
              </p>
            </div>
            <Button variant="outline" onClick={() => setPhase('settings')} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
