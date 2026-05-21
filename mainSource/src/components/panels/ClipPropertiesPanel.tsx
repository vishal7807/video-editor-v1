import { useEditorStore } from '@/store/editorStore'
import { useTimelineStore } from '@/store/timelineStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useClipOperations } from '@/hooks/useClipOperations'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Scissors, Trash2, Gauge } from 'lucide-react'

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export default function ClipPropertiesPanel() {
  const { selectedClipId, selectedTrackId, videoMetadata, currentTime } = useEditorStore()
  const { tracks } = useTimelineStore()
  const { speed, setSpeed, volume, setVolume, isMuted, setIsMuted } = usePlaybackStore()
  const { changeClipSpeed, changeClipVolume, splitClip, deleteClip } = useClipOperations()

  // Find selected clip
  const selectedClip = selectedTrackId && selectedClipId
    ? tracks
        .find((t) => t.id === selectedTrackId)
        ?.clips.find((c) => c.id === selectedClipId)
    : null

  // Also try finding without trackId (just clipId)
  const clip = selectedClip || (selectedClipId
    ? tracks.flatMap((t) => t.clips.map((c) => ({ ...c, _trackId: t.id }))).find((c) => c.id === selectedClipId)
    : null)

  const trackId = selectedClip
    ? selectedTrackId!
    : clip && '_trackId' in clip
      ? (clip as { _trackId: string })._trackId
      : null

  return (
    <div className="p-4 space-y-6">
      {/* Playback Speed — always visible */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-primary" />
          <Label className="text-sm font-semibold">Playback Speed</Label>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SPEED_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s)
                if (clip && trackId) {
                  changeClipSpeed(trackId, clip.id, s)
                }
              }}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                speed === s
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Global Volume */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Volume</Label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
          <input
            type="checkbox"
            checked={isMuted}
            onChange={(e) => setIsMuted(e.target.checked)}
            className="rounded accent-primary"
          />
          Mute audio
        </label>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Clip-specific controls */}
      {clip && trackId ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Selected Clip</h3>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Source</span>
              <span className="text-foreground truncate max-w-[120px]">{clip.source}</span>
            </div>
            <div className="flex justify-between">
              <span>Start</span>
              <span className="text-foreground">{clip.startTime.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Duration</span>
              <span className="text-foreground">{clip.duration.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Speed</span>
              <span className="text-foreground">{clip.speed}x</span>
            </div>
          </div>

          {/* Clip Volume */}
          <div className="space-y-2">
            <Label className="text-xs">Clip Volume</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={clip.volume}
              onChange={(e) =>
                changeClipVolume(trackId, clip.id, parseFloat(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={() => splitClip(trackId, clip.id, currentTime)}
              disabled={
                currentTime <= clip.startTime ||
                currentTime >= clip.startTime + clip.duration
              }
            >
              <Scissors size={14} />
              Split
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={() => deleteClip(trackId, clip.id)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No clip selected</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click a clip in the timeline to edit it
          </p>
        </div>
      )}

      {/* Video Info */}
      {videoMetadata && (
        <>
          <div className="h-px bg-border" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Video Info</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Resolution</span>
                <span className="text-foreground">
                  {videoMetadata.width}×{videoMetadata.height}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-foreground">{videoMetadata.duration.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span>FPS</span>
                <span className="text-foreground">{videoMetadata.fps}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
