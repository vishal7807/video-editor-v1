import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useTimelineStore } from '@/store/timelineStore'

export function useKeyboardShortcuts() {
  const {
    isPlaying, setIsPlaying, currentTime, setCurrentTime,
    videoMetadata, selectedClipId, loopEnabled, setLoopEnabled, saveSnapshot
  } = useEditorStore()
  const { speed, setSpeed } = usePlaybackStore()
  const { removeClip, tracks } = useTimelineStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const isMeta = e.ctrlKey || e.metaKey

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case 'KeyL':
          e.preventDefault()
          setLoopEnabled(!loopEnabled)
          break
        case 'ArrowLeft':
          if (videoMetadata) {
            e.preventDefault()
            setCurrentTime(Math.max(0, currentTime - (e.shiftKey ? 1 : 0.1)))
          }
          break
        case 'ArrowRight':
          if (videoMetadata) {
            e.preventDefault()
            setCurrentTime(Math.min(videoMetadata.duration, currentTime + (e.shiftKey ? 1 : 0.1)))
          }
          break
        case 'Home':
          e.preventDefault()
          setCurrentTime(0)
          break
        case 'End':
          if (videoMetadata) { e.preventDefault(); setCurrentTime(videoMetadata.duration) }
          break
        case 'Delete':
        case 'Backspace':
          if (selectedClipId) {
            e.preventDefault()
            for (const track of tracks) {
              if (track.clips.find((c) => c.id === selectedClipId)) {
                removeClip(track.id, selectedClipId)
                useEditorStore.setState({ selectedClipId: null, selectedTrackId: null })
                saveSnapshot()
                break
              }
            }
          }
          break
        case 'Minus':
        case 'NumpadSubtract':
          if (isMeta) { e.preventDefault(); setSpeed(Math.max(0.5, speed - 0.25)) }
          break
        case 'Equal':
        case 'NumpadAdd':
          if (isMeta) { e.preventDefault(); setSpeed(Math.min(2, speed + 0.25)) }
          break
        case 'Digit0':
          if (isMeta) { e.preventDefault(); setSpeed(1) }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, speed, currentTime, videoMetadata, selectedClipId, loopEnabled,
      setIsPlaying, setSpeed, setCurrentTime, setLoopEnabled, removeClip, tracks])
}
