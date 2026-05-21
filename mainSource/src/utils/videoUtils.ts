/**
 * Video utility functions for processing and validation
 */

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(p => parseInt(p, 10))
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] || 0
}

export function isValidVideoFile(file: File): boolean {
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
  
  const hasValidType = validTypes.some(type => file.type.startsWith(type.split('/')[0]))
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  
  return hasValidType || hasValidExtension
}

export function getVideoDimensions(video: HTMLVideoElement): { width: number; height: number } {
  return {
    width: video.videoWidth,
    height: video.videoHeight,
  }
}

export function getFrameNumber(time: number, fps: number = 30): number {
  return Math.floor(time * fps)
}

export function getTimeFromFrame(frameNumber: number, fps: number = 30): number {
  return frameNumber / fps
}

export async function getVideoMetadata(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30, // Default, could be more precise
      })
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video metadata'))
    }
    
    video.src = url
  })
}

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

export function clampTime(time: number, duration: number): number {
  return Math.max(0, Math.min(time, duration))
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}
