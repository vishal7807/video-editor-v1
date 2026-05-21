import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioStore } from '@/store/audioStore'
import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { Music, Trash2, Plus, Volume2, VolumeX, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'

export default function AudioPanel() {
  const { tracks, addAudioTrack, removeAudioTrack, updateAudioTrack } = useAudioStore()
  const { currentTime, videoMetadata, setActiveTool, setSidePanelOpen, setSelectedElementType, searchQuery } =
    useEditorStore()
  const audioInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const tracksWithNames = tracks.map((track, i) => ({
    ...track,
    displayName: track.name || (track.source ? decodeURIComponent(track.source.split('/').pop() || `Audio ${i + 1}`) : `Audio ${i + 1}`)
  }))

  const filteredTracks = tracksWithNames.filter((t) =>
    t.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const handleAddAudio = () => audioInputRef.current?.click()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      toast.error('Select an audio file')
      return
    }
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audio.onloadedmetadata = () => {
      addAudioTrack({
        id: `audio-${Date.now()}`,
        name: file.name,
        source: url,
        startTime: currentTime,
        trimStart: 0,
        duration: audio.duration,
        volume: 0.8,
        muted: false,
      })
      toast.success(`Added "${file.name}"`)
      // Close panel and show context toolbar
      setSidePanelOpen(false)
      setActiveTool(null)
      setSelectedElementType('audio')
    }
    audio.onerror = () => {
      toast.error('Failed to load audio')
      URL.revokeObjectURL(url)
    }
    e.target.value = ''
  }

  const handleTrackClick = (trackId: string) => {
    // Select audio, close panel, show audio toolbar
    setSidePanelOpen(false)
    setActiveTool(null)
    setSelectedElementType('audio')
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold">Audio uploads</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddAudio}
          className="h-6 gap-1 text-[10px] px-2"
        >
          <Plus size={12} />
          Add files
        </Button>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* Audio List */}
      {tracks.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="mx-auto w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Music size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-[11px] text-muted-foreground">No audio tracks</p>
          <p className="text-[10px] text-muted-foreground/50">Add background music or voiceover</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="mx-auto w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Search size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-[11px] text-muted-foreground">No audio found</p>
          <p className="text-[10px] text-muted-foreground/50">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filteredTracks.map((track) => {
              const name = track.displayName

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => handleTrackClick(track.id)}
                >
                  {/* Thumbnail */}
                  <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                    <Music size={14} className="text-accent" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" title={name}>
                      {name.length > 20 ? name.slice(0, 18) + '...' : name}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {track.duration.toFixed(1)}s · {Math.round(track.volume * 100)}%
                    </p>
                  </div>

                  {/* Actions (show on hover) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateAudioTrack(track.id, { muted: !track.muted })
                      }}
                      className={`icon-btn w-6 h-6 ${track.muted ? 'text-destructive' : ''}`}
                    >
                      {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAudioTrack(track.id)
                      }}
                      className="icon-btn w-6 h-6 hover:!text-destructive"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
