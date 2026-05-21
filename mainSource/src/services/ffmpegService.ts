/**
 * FFmpeg.wasm service for video processing fallback
 * Used when WebCodecs is not available or for complex operations
 */

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export class FFmpegService {
  private ffmpeg: FFmpeg
  private isLoaded: boolean = false
  private isLoading: boolean = false

  constructor() {
    this.ffmpeg = new FFmpeg()
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return
    if (this.isLoading) {
      // Wait for ongoing load
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    this.isLoading = true
    try {
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
      await this.ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      })
      this.isLoaded = true
      console.log('[FFmpeg] FFmpeg loaded successfully')
    } catch (error) {
      console.error('[FFmpeg] Failed to load FFmpeg:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  getIsLoaded(): boolean {
    return this.isLoaded
  }

  async transcode(
    inputFile: File,
    outputFormat: 'mp4' | 'webm',
    options: {
      resolution?: '720p' | '1080p'
      quality?: 'low' | 'medium' | 'high'
    } = {}
  ): Promise<Blob> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not initialized')
    }

    const inputName = 'input.' + this.getFileExtension(inputFile.type)
    const outputName = `output.${outputFormat}`

    // Write input file
    const fileData = new Uint8Array(await inputFile.arrayBuffer())
    await this.ffmpeg.writeFile(inputName, fileData)

    // Get video dimensions and calculate output size
    const { width, height } = options.resolution === '1080p'
      ? { width: 1920, height: 1080 }
      : { width: 1280, height: 720 }

    // FFmpeg command
    const args = [
      '-i', inputName,
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v', outputFormat === 'mp4' ? 'libx264' : 'libvpx-vp9',
      '-crf', this.getQualityValue(options.quality),
      '-c:a', outputFormat === 'mp4' ? 'aac' : 'libopus',
      outputName,
    ]

    await this.ffmpeg.exec(args)

    // Read output file
    const output = await this.ffmpeg.readFile(outputName)
    const blob = new Blob([output], { type: this.getMimeType(outputFormat) })

    // Clean up
    await this.ffmpeg.deleteFile(inputName)
    await this.ffmpeg.deleteFile(outputName)

    return blob
  }

  async extractFrames(
    videoFile: File,
    interval: number = 1 // seconds
  ): Promise<ImageData[]> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not initialized')
    }

    const inputName = 'input.' + this.getFileExtension(videoFile.type)
    const framePattern = 'frame_%03d.png'

    const fileData = new Uint8Array(await videoFile.arrayBuffer())
    await this.ffmpeg.writeFile(inputName, fileData)

    // Extract frames
    const args = [
      '-i', inputName,
      '-vf', `fps=1/${interval}`,
      framePattern,
    ]

    await this.ffmpeg.exec(args)

    // This would require reading and processing PNG files
    // For now, we just return empty array
    // In production, you'd iterate through frame_001.png, frame_002.png, etc.

    await this.ffmpeg.deleteFile(inputName)

    return []
  }

  async concatVideos(videoFiles: File[], outputFormat: 'mp4' | 'webm'): Promise<Blob> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not initialized')
    }

    // Create concat file
    let concatContent = ''
    const inputNames: string[] = []

    for (let i = 0; i < videoFiles.length; i++) {
      const inputName = `input_${i}.${this.getFileExtension(videoFiles[i].type)}`
      inputNames.push(inputName)

      const fileData = new Uint8Array(await videoFiles[i].arrayBuffer())
      await this.ffmpeg.writeFile(inputName, fileData)

      concatContent += `file '${inputName}'\n`
    }

    await this.ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent))

    const outputName = `output.${outputFormat}`
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy',
      outputName,
    ]

    await this.ffmpeg.exec(args)

    const output = await this.ffmpeg.readFile(outputName)
    const blob = new Blob([output], { type: this.getMimeType(outputFormat) })

    // Clean up
    for (const inputName of inputNames) {
      await this.ffmpeg.deleteFile(inputName)
    }
    await this.ffmpeg.deleteFile('concat.txt')
    await this.ffmpeg.deleteFile(outputName)

    return blob
  }

  private getFileExtension(mimeType: string): string {
    if (mimeType.includes('mp4')) return 'mp4'
    if (mimeType.includes('webm')) return 'webm'
    if (mimeType.includes('quicktime')) return 'mov'
    return 'mp4'
  }

  private getMimeType(format: 'mp4' | 'webm'): string {
    return format === 'mp4' ? 'video/mp4' : 'video/webm'
  }

  private getQualityValue(quality?: string): string {
    // CRF values: 18-28 (lower = better)
    switch (quality) {
      case 'high':
        return '18'
      case 'low':
        return '28'
      default:
        return '23'
    }
  }

  async close(): Promise<void> {
    if (this.ffmpeg && this.isLoaded) {
      // FFmpeg.wasm doesn't have an explicit close method
      // Just mark as unloaded
      this.isLoaded = false
    }
  }
}

export const ffmpegService = new FFmpegService()
