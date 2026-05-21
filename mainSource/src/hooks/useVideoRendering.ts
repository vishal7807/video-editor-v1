import { useRef, useCallback, useEffect } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { buildFilterString } from '@/utils/filterUtils'

export function useVideoRendering(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
) {
  const { filterValues } = useFilterStore()
  const animationIdRef = useRef<number | null>(null)

  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    // Draw video frame with filters
    const filterString = buildFilterString(filterValues)
    ctx.filter = filterString

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    } catch (e) {
      // Ignore cross-origin errors in local testing
      console.log('[Rendering] Using native video filters instead')
    }

    // Reset filter
    ctx.filter = 'none'
  }, [videoRef, canvasRef, filterValues])

  // Redraw on filter changes
  useEffect(() => {
    if (videoRef.current && !videoRef.current.paused) {
      drawFrame()
    }
  }, [filterValues, drawFrame])

  // Redraw on playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      drawFrame()
    }

    const handlePlay = () => {
      const renderFrame = () => {
        drawFrame()
        if (!video.paused) {
          animationIdRef.current = requestAnimationFrame(renderFrame)
        }
      }
      animationIdRef.current = requestAnimationFrame(renderFrame)
    }

    const handlePause = () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      drawFrame()
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)

    // Draw initial frame
    drawFrame()

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [drawFrame, videoRef, canvasRef])

  return { drawFrame }
}
