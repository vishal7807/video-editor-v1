import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Film, Plus, Trash2, Search } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useTimelineStore } from '@/store/timelineStore'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'

interface UploadPanelProps {
  onVideoUpload: (file: File) => void
}

export default function UploadPanel({ onVideoUpload }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadedVideos, removeUploadedVideo, saveSnapshot, searchQuery } = useEditorStore()
  const debouncedSearch = useDebounce(searchQuery, 300)

  const filteredVideos = uploadedVideos.filter((v) =>
    v.file.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onVideoUpload(file)
    e.target.value = ''
  }

  const handleAddToTimeline = (video: typeof uploadedVideos[0]) => {
    const { tracks, addTrack, addClip } = useTimelineStore.getState()
    const track = tracks.length > 0 ? tracks[0] : null
    const trackId = track ? track.id : `track-${Date.now()}`
    
    let newStartTime = 0
    if (track && track.clips.length > 0) {
      const lastClip = track.clips.reduce((prev, current) => 
        (prev.startTime + prev.duration > current.startTime + current.duration) ? prev : current
      )
      newStartTime = lastClip.startTime + lastClip.duration
    }

    if (!track) {
      addTrack({
        id: trackId,
        clips: [],
        name: 'Video Track',
        opacity: 1,
        muted: false,
      })
    }

    addClip(trackId, {
      id: `clip-${Date.now()}`,
      trackId,
      startTime: newStartTime,
      trimStart: 0,
      duration: video.metadata.duration,
      source: video.url,
      name: video.file.name,
      speed: 1,
      volume: 1,
    })

    toast.success(`Added "${video.file.name}" to timeline`)
    saveSnapshot()
  }

  const handleDeleteVideo = (video: typeof uploadedVideos[0]) => {
    removeUploadedVideo(video.id)
    // Also remove any clips from timeline that use this source
    const { tracks, removeClip } = useTimelineStore.getState()
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.source === video.url) {
          removeClip(track.id, clip.id)
        }
      })
    })
    saveSnapshot()
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold">Video uploads</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="h-6 gap-1 text-[10px] px-2"
        >
          <Plus size={12} />
          Add files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Video List */}
      {uploadedVideos.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="mx-auto w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Film size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-[11px] text-muted-foreground">No videos uploaded</p>
          <p className="text-[10px] text-muted-foreground/50">Add a video to start editing</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="mx-auto w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Search size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-[11px] text-muted-foreground">No videos found</p>
          <p className="text-[10px] text-muted-foreground/50">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filteredVideos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-12 h-8 bg-black rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
                  <video src={video.url} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" title={video.file.name}>
                    {video.file.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {video.metadata.duration.toFixed(1)}s · {video.metadata.width}×{video.metadata.height}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAddToTimeline(video)}
                    className="icon-btn w-6 h-6 text-accent"
                    title="Add to Timeline"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video)}
                    className="icon-btn w-6 h-6 hover:!text-destructive"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
