/**
 * Canvas filter utility functions for applying video effects
 */

export interface FilterConfig {
  brightness?: number
  contrast?: number
  saturation?: number
  blur?: number
  sepia?: number
  grayscale?: number
  hueRotate?: number
  invert?: number
}

export function buildFilterString(config: FilterConfig): string {
  const filters: string[] = []

  if (config.brightness !== undefined && config.brightness !== 100) {
    filters.push(`brightness(${config.brightness}%)`)
  }

  if (config.contrast !== undefined && config.contrast !== 100) {
    filters.push(`contrast(${config.contrast}%)`)
  }

  if (config.saturation !== undefined && config.saturation !== 100) {
    filters.push(`saturate(${config.saturation}%)`)
  }

  if (config.blur !== undefined && config.blur !== 0) {
    filters.push(`blur(${config.blur}px)`)
  }

  if (config.sepia !== undefined && config.sepia !== 0) {
    filters.push(`sepia(${config.sepia}%)`)
  }

  if (config.grayscale !== undefined && config.grayscale !== 0) {
    filters.push(`grayscale(${config.grayscale}%)`)
  }

  if (config.hueRotate !== undefined && config.hueRotate !== 0) {
    filters.push(`hue-rotate(${config.hueRotate}deg)`)
  }

  if (config.invert !== undefined && config.invert !== 0) {
    filters.push(`invert(${config.invert}%)`)
  }

  return filters.join(' ')
}

export function applyFiltersToCanvas(
  ctx: CanvasRenderingContext2D,
  config: FilterConfig
): void {
  ctx.filter = buildFilterString(config)
}

export function resetCanvasFilter(ctx: CanvasRenderingContext2D): void {
  ctx.filter = 'none'
}

/**
 * Apply filters to image data using pixel manipulation
 * Useful when canvas filters aren't supported
 */
export function applyFiltersToImageData(
  imageData: ImageData,
  config: FilterConfig
): ImageData {
  const data = imageData.data
  const length = data.length

  for (let i = 0; i < length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    const a = data[i + 3]

    // Brightness
    if (config.brightness !== undefined && config.brightness !== 100) {
      const factor = config.brightness / 100
      r *= factor
      g *= factor
      b *= factor
    }

    // Contrast
    if (config.contrast !== undefined && config.contrast !== 100) {
      const factor = config.contrast / 100
      r = ((r / 255 - 0.5) * factor + 0.5) * 255
      g = ((g / 255 - 0.5) * factor + 0.5) * 255
      b = ((b / 255 - 0.5) * factor + 0.5) * 255
    }

    // Grayscale
    if (config.grayscale !== undefined && config.grayscale !== 0) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      const factor = config.grayscale / 100
      r = r * (1 - factor) + gray * factor
      g = g * (1 - factor) + gray * factor
      b = b * (1 - factor) + gray * factor
    }

    // Sepia
    if (config.sepia !== undefined && config.sepia !== 0) {
      const factor = config.sepia / 100
      const sepiaR = r * 0.393 + g * 0.769 + b * 0.189
      const sepiaG = r * 0.349 + g * 0.686 + b * 0.168
      const sepiaB = r * 0.272 + g * 0.534 + b * 0.131
      r = r * (1 - factor) + sepiaR * factor
      g = g * (1 - factor) + sepiaG * factor
      b = b * (1 - factor) + sepiaB * factor
    }

    // Invert
    if (config.invert !== undefined && config.invert !== 0) {
      const factor = config.invert / 100
      r = r * (1 - factor) + (255 - r) * factor
      g = g * (1 - factor) + (255 - g) * factor
      b = b * (1 - factor) + (255 - b) * factor
    }

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
    data[i + 3] = a
  }

  return imageData
}
