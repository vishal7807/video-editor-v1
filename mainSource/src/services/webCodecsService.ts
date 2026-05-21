/**
 * WebCodecs API service for video encoding/decoding
 * Primary video processing method (modern browsers only)
 */

export class WebCodecsService {
  private encoder: VideoEncoder | null = null
  private decoder: VideoDecoder | null = null
  private frameQueue: VideoFrame[] = []
  private isSupported: boolean = false

  constructor() {
    this.checkSupport()
  }

  private checkSupport(): void {
    this.isSupported = typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined'
    if (this.isSupported) {
      console.log('[WebCodecs] WebCodecs API is supported')
    } else {
      console.log('[WebCodecs] WebCodecs API is not supported, fallback will be used')
    }
  }

  getIsSupported(): boolean {
    return this.isSupported
  }

  async initializeEncoder(config: VideoEncoderConfig): Promise<void> {
    if (!this.isSupported) {
      throw new Error('WebCodecs not supported')
    }

    return new Promise((resolve, reject) => {
      this.encoder = new VideoEncoder({
        output: (chunk) => {
          // Handle encoded output
          console.log('[WebCodecs] Encoded chunk:', chunk)
        },
        error: (error) => {
          console.error('[WebCodecs] Encoder error:', error)
          reject(error)
        },
      })

      try {
        this.encoder.configure(config)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async initializeDecoder(config: VideoDecoderConfig): Promise<void> {
    if (!this.isSupported) {
      throw new Error('WebCodecs not supported')
    }

    return new Promise((resolve, reject) => {
      this.decoder = new VideoDecoder({
        output: (frame) => {
          this.frameQueue.push(frame)
        },
        error: (error) => {
          console.error('[WebCodecs] Decoder error:', error)
          reject(error)
        },
      })

      try {
        this.decoder.configure(config)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async encodeFrame(frame: VideoFrame): Promise<void> {
    if (!this.encoder || !this.isSupported) {
      throw new Error('Encoder not initialized')
    }

    return new Promise((resolve) => {
      this.encoder!.encode(frame, { keyFrame: false })
      resolve()
    })
  }

  async decodeFrame(chunk: EncodedVideoChunk): Promise<void> {
    if (!this.decoder || !this.isSupported) {
      throw new Error('Decoder not initialized')
    }

    return new Promise((resolve) => {
      this.decoder!.decode(chunk)
      resolve()
    })
  }

  getDecodedFrame(): VideoFrame | null {
    if (this.frameQueue.length === 0) return null
    return this.frameQueue.shift() || null
  }

  async closeEncoder(): Promise<void> {
    if (this.encoder) {
      await this.encoder.flush()
      this.encoder.close()
      this.encoder = null
    }
  }

  async closeDecoder(): Promise<void> {
    if (this.decoder) {
      await this.decoder.flush()
      this.decoder.close()
      this.decoder = null
    }
  }

  async close(): Promise<void> {
    await this.closeEncoder()
    await this.closeDecoder()
    this.frameQueue = []
  }
}

export const webCodecsService = new WebCodecsService()
