import { useTimelineStore } from '@/store/timelineStore'
import { Clip } from '@/types'

export function useClipOperations() {
  const { tracks, updateClip, removeClip, addClip } = useTimelineStore()

  const trimClip = (trackId: string, clipId: string, startTrim: number, endTrim: number) => {
    const clip = tracks
      .find(t => t.id === trackId)
      ?.clips.find(c => c.id === clipId)

    if (!clip) return

    const newDuration = clip.duration - startTrim - endTrim
    if (newDuration <= 0) return

    updateClip(trackId, clipId, {
      startTime: clip.startTime + startTrim,
      duration: newDuration,
    })
  }

  const splitClip = (trackId: string, clipId: string, splitTime: number) => {
    const track = tracks.find(t => t.id === trackId)
    const clip = track?.clips.find(c => c.id === clipId)

    if (!track || !clip) return

    const relativeTime = splitTime - clip.startTime
    if (relativeTime <= 0 || relativeTime >= clip.duration) return

    // Create second half clip
    const secondHalf: Clip = {
      id: `clip-${Date.now()}`,
      trackId,
      startTime: splitTime,
      trimStart: (clip.trimStart || 0) + relativeTime,
      duration: clip.duration - relativeTime,
      source: clip.source,
      speed: clip.speed,
      volume: clip.volume,
    }

    // Update first clip
    updateClip(trackId, clipId, {
      duration: relativeTime,
    })

    // Add second clip
    addClip(trackId, secondHalf)
  }

  const moveClip = (trackId: string, clipId: string, newStartTime: number) => {
    if (newStartTime < 0) return
    updateClip(trackId, clipId, { startTime: newStartTime })
  }

  const changeClipSpeed = (trackId: string, clipId: string, speed: number) => {
    if (speed < 0.25 || speed > 4) return
    updateClip(trackId, clipId, { speed })
  }

  const changeClipVolume = (trackId: string, clipId: string, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    updateClip(trackId, clipId, { volume: clampedVolume })
  }

  const deleteClip = (trackId: string, clipId: string) => {
    removeClip(trackId, clipId)
  }

  return {
    trimClip,
    splitClip,
    moveClip,
    changeClipSpeed,
    changeClipVolume,
    deleteClip,
  }
}
