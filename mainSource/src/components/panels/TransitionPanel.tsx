import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useTimelineStore } from '@/store/timelineStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

const TRANSITION_TYPES = [
  {
    id: 'none',
    name: 'None',
    description: 'Remove transition (cut)',
    icon: '⏹️',
  },
  {
    id: 'fade',
    name: 'Fade',
    description: 'Gradually fade between clips',
    icon: '🌑',
  },
  {
    id: 'slide',
    name: 'Slide',
    description: 'Slide one clip over another',
    icon: '➡️',
  },
  {
    id: 'wipe',
    name: 'Wipe',
    description: 'Wipe from one side to other',
    icon: '🔲',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Zoom in/out between clips',
    icon: '🔍',
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    description: 'Smooth dissolve transition',
    icon: '💫',
  },
]

export default function TransitionPanel() {
  const [selectedTransition, setSelectedTransition] = useState('fade')
  const [duration, setDuration] = useState(0.5)
  const { selectedClipId, saveSnapshot } = useEditorStore()
  const { tracks, updateClip } = useTimelineStore()

  const handleApply = () => {
    if (!selectedClipId) {
      toast.warning('Select a clip in the timeline first')
      return
    }

    // Find the clip and update it with transition info
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId)
      if (clip) {
        updateClip(track.id, clip.id, {
          transition: selectedTransition === 'none' ? undefined : { type: selectedTransition, duration }
        })
        saveSnapshot()
        if (selectedTransition === 'none') {
          toast.success('Removed transition')
        } else {
          toast.success(`Applied "${selectedTransition}" transition (${duration}s)`)
        }
        return
      }
    }

    toast.error('Selected clip not found')
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold">Transitions</h3>
      <p className="text-xs text-muted-foreground">
        Select a clip, then choose a transition to apply between clips.
      </p>

      {/* Transition Grid */}
      <div className="space-y-1.5">
        {TRANSITION_TYPES.map((transition) => (
          <button
            key={transition.id}
            onClick={() => setSelectedTransition(transition.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
              selectedTransition === transition.id
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border'
            }`}
          >
            <span className="text-xl">{transition.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">{transition.name}</div>
              <div className="text-[10px] text-muted-foreground">{transition.description}</div>
            </div>
            {selectedTransition === transition.id && (
              <Check size={14} className="text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Duration (hide for None) */}
      {selectedTransition !== 'none' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Duration: {duration.toFixed(1)}s</Label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Preview */}
      {selectedTransition !== 'none' && (
        <div className="bg-muted/20 rounded-lg p-4 h-24 flex items-center justify-center border border-border/30 overflow-hidden relative">
          <TransitionPreview type={selectedTransition} duration={duration} />
        </div>
      )}

      <Button onClick={handleApply} className="w-full text-sm" size="sm">
        Apply Transition
      </Button>

      {!selectedClipId && (
        <p className="text-[10px] text-amber-400/80 text-center">
          ⚠ Select a clip on the timeline first
        </p>
      )}
    </div>
  )
}

function TransitionPreview({ type, duration }: { type: string; duration: number }) {
  const animDuration = `${duration}s`

  return (
    <div className="flex items-center gap-2 w-full h-full">
      <div
        className="flex-1 h-full bg-primary/40 rounded"
        style={{
          animation:
            type === 'fade'
              ? `fadeOutPreview ${animDuration} ease-in-out infinite alternate`
              : type === 'slide'
                ? `slideOutPreview ${animDuration} ease-in-out infinite alternate`
                : type === 'zoom'
                  ? `zoomOutPreview ${animDuration} ease-in-out infinite alternate`
                  : undefined,
        }}
      />
      <div className="text-[10px] text-muted-foreground shrink-0">→</div>
      <div
        className="flex-1 h-full bg-accent/40 rounded"
        style={{
          animation:
            type === 'fade'
              ? `fadeInPreview ${animDuration} ease-in-out infinite alternate`
              : type === 'slide'
                ? `slideInPreview ${animDuration} ease-in-out infinite alternate`
                : type === 'zoom'
                  ? `zoomInPreview ${animDuration} ease-in-out infinite alternate`
                  : undefined,
        }}
      />
    </div>
  )
}
