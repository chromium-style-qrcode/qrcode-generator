import { useRef, useState, useEffect, useCallback } from 'react'
import { i18n } from '#i18n'

import { loadWasmModule, type WasmQRGenerator } from '../lib/wasm-loader'

// Polyfill for roundRect if not available
if (
  typeof CanvasRenderingContext2D !== 'undefined' &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | number[]
  ) {
    let radii: number[]
    if (typeof radius === 'number') {
      radii = [radius, radius, radius, radius]
    } else if (radius.length === 1) {
      radii = [radius[0], radius[0], radius[0], radius[0]]
    } else if (radius.length === 2) {
      radii = [radius[0], radius[1], radius[0], radius[1]]
    } else {
      radii = radius as number[]
    }

    this.beginPath()
    this.moveTo(x + radii[0], y)
    this.arcTo(x + width, y, x + width, y + height, radii[1])
    this.arcTo(x + width, y + height, x, y + height, radii[2])
    this.arcTo(x, y + height, x, y, radii[3])
    this.arcTo(x, y, x + width, y, radii[0])
    this.closePath()
    return this
  }
}

// Constants matching Chromium implementation
const MODULE_SIZE_PIXELS = 10
const DINO_TILE_SIZE_PIXELS = 4
const LOCATOR_SIZE_MODULES = 7
const QUIET_ZONE_SIZE_PIXELS = MODULE_SIZE_PIXELS * 4
const MAX_INPUT_LENGTH = 2000

// Error types for better error handling
export const enum ErrorType {
  InitFailed = 'INIT_FAILED',
  InputTooLong = 'INPUT_TOO_LONG',
  GenerationFailed = 'GENERATION_FAILED'
}

const moduleColor = '#000000' // Black
const backgroundColor = '#FFFFFF' // White

// --- Center icon config (replacing Chromium dino with firefox.png) ---
// We keep the same target bounding box as the original dino (20x22 tiles)
// to preserve visual balance, but we letterbox the image to keep its aspect ratio.
const kCenterTargetWidthTiles = 20
const kCenterTargetHeightTiles = 22

// Preload and cache a grayscale version of public/logo/firefox.png
let centerIconImage: HTMLImageElement | null = null
let centerIconGrayCanvas: HTMLCanvasElement | null = null
let centerIconReady: Promise<void> | null = null

const ensureCenterIconReady = (): Promise<void> => {
  if (centerIconReady) return centerIconReady

  centerIconImage = new Image()
  // Assets under public/ are served from root; in extensions use runtime URL
  const path = 'logo/firefox.png'
  const runtime =
    (globalThis as any).chrome?.runtime || (globalThis as any).browser?.runtime
  const src =
    runtime && typeof runtime.getURL === 'function'
      ? runtime.getURL(path)
      : `/${path}`
  centerIconImage.src = src
  centerIconImage.crossOrigin = 'anonymous'

  const decodePromise =
    typeof centerIconImage.decode === 'function'
      ? centerIconImage.decode()
      : new Promise<void>((resolve, reject) => {
          centerIconImage!.onload = () => resolve()
          centerIconImage!.onerror = () => reject(new Error('Icon load error'))
        })

  centerIconReady = decodePromise
    .then(() => {
      // Build a grayscale canvas once for reuse
      const off = document.createElement('canvas')
      off.width = centerIconImage!.naturalWidth
      off.height = centerIconImage!.naturalHeight
      const offCtx = off.getContext('2d')!
      offCtx.drawImage(centerIconImage!, 0, 0)
      const imgData = offCtx.getImageData(0, 0, off.width, off.height)
      const data = imgData.data
      // Convert to grayscale using luminance formula
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // sRGB luminance (approx)
        const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
        data[i] = data[i + 1] = data[i + 2] = y
        // Keep original alpha
      }
      offCtx.putImageData(imgData, 0, 0)
      centerIconGrayCanvas = off
    })
    .catch((err) => {
      console.warn('Failed to preload center icon:', err)
    })

  return centerIconReady
}

interface QRCodeState {
  isLoading: boolean
  error: string | null
  errorType: string | null
  qrData: Uint8Array | null
  qrSize: number
  originalSize: number
}

interface QRCodeActions {
  generateQRCode: (text: string) => Promise<void>
  copyQRCode: () => Promise<void>
  downloadQRCode: (filename?: string) => void
  clearError: () => void
}

export const useQRCode = (): [QRCodeState, QRCodeActions] => {
  const [state, setState] = useState<QRCodeState>({
    qrSize: 0,
    error: null,
    qrData: null,
    errorType: null,
    originalSize: 0,
    isLoading: false
  })
  const wasmModuleRef = useRef<WasmQRGenerator>(null)

  // Initialize WASM module
  useEffect(() => {
    const initWasm = async () => {
      try {
        wasmModuleRef.current = await loadWasmModule()
        console.log('WASM module loaded successfully')
      } catch (error) {
        setState((prev) => ({
          ...prev,
          errorType: ErrorType.InitFailed,
          error: i18n.t('error_init_failed')
        }))
      }
    }

    initWasm()
  }, [])

  const generateQRCode = useCallback(async (inputText: string) => {
    if (!inputText.trim()) {
      setState((prev) => ({
        ...prev,
        qrSize: 0,
        error: null,
        qrData: null,
        errorType: null,
        originalSize: 0
      }))
      return
    }

    if (inputText.length > MAX_INPUT_LENGTH) {
      setState((prev) => ({
        ...prev,
        qrSize: 0,
        qrData: null,
        originalSize: 0,
        errorType: ErrorType.InputTooLong,
        error: i18n.t('error_input_too_long', [MAX_INPUT_LENGTH])
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      error: null,
      errorType: null,
      isLoading: true
    }))

    try {
      if (!wasmModuleRef.current) return

      const result = wasmModuleRef.current.generate_qr_code_with_options(
        inputText,
        wasmModuleRef.current.ModuleStyle.Circles, // Data modules as circles (kCircles)
        wasmModuleRef.current.LocatorStyle.Rounded, // Rounded locators (kRounded)
        wasmModuleRef.current.CenterImage.Dino, // Dino center image (kDino)
        wasmModuleRef.current.QuietZone.WillBeAddedByClient // Match Android bridge layer behavior
      )

      if (!result || !result.data) {
        throw new Error('Invalid QR generation result')
      }

      setState((prev) => ({
        ...prev,
        error: null,
        errorType: null,
        isLoading: false,
        qrData: result.data,
        qrSize: result.size,
        originalSize: result.original_size
      }))
    } catch (error) {
      let [
        errorType = ErrorType.GenerationFailed,
        errorMessage = i18n.t('error_generate_failed')
      ] = [] as unknown as [string]
      if (error && `${error}`.includes('too long')) {
        errorType = ErrorType.InputTooLong
        errorMessage = i18n.t('error_input_too_long', [MAX_INPUT_LENGTH])
      }

      setState((prev) => ({
        ...prev,
        errorType,
        qrSize: 0,
        qrData: null,
        originalSize: 0,
        isLoading: false,
        error: errorMessage
      }))
    }
  }, [])

  const copyQRCode = useCallback(async () => {
    if (!state.qrData || !state.originalSize) return

    try {
      // Ensure center icon is ready so it's included in the copied image
      await ensureCenterIconReady()
      // Create a canvas for clipboard with Chromium-exact size
      const clipboardCanvas = document.createElement('canvas')
      const clipboardCtx = clipboardCanvas.getContext('2d')
      if (!clipboardCtx) throw new Error('Could not get canvas context')

      // Re-render QR code at exact size
      renderQRCodeToCanvasWithSize(
        clipboardCanvas,
        clipboardCtx,
        state.qrData,
        state.qrSize,
        state.originalSize
      )

      const blob = await new Promise<Blob>((resolve, reject) => {
        clipboardCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, 'image/png')
      })

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
    } catch (error) {
      console.error('Failed to copy QR code:', error)
      throw error // Re-throw to allow caller to handle with text fallback
    }
  }, [state.qrData, state.qrSize, state.originalSize])

  const downloadQRCode = useCallback(
    (filename = 'qrcode_firefox.png') => {
      if (!state.qrData || !state.originalSize) return

      // Create a temporary canvas with Chromium-exact sizing
      const downloadCanvas = document.createElement('canvas')
      const downloadCtx = downloadCanvas.getContext('2d')
      if (!downloadCtx) return

      // Ensure icon is preloaded so it's present in the output
      ensureCenterIconReady()
        .catch(() => void 0)
        .finally(() => {
          // Re-render QR code at exact download size
          renderQRCodeToCanvasWithSize(
            downloadCanvas,
            downloadCtx,
            state.qrData!,
            state.qrSize,
            state.originalSize
          )

          const link = document.createElement('a')
          link.download = filename
          link.href = downloadCanvas.toDataURL('image/png')
          link.click()
        })
    },
    [state.qrData, state.qrSize, state.originalSize]
  )

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, errorType: null }))
  }, [])

  return [state, { clearError, copyQRCode, generateQRCode, downloadQRCode }]
}

// Helper function to check if a module position is part of a locator pattern
const isLocatorModule = (x: number, y: number, originalSize: number) => {
  // Top-left locator
  if (x < LOCATOR_SIZE_MODULES && y < LOCATOR_SIZE_MODULES) {
    return true
  }

  // Top-right locator
  if (x >= originalSize - LOCATOR_SIZE_MODULES && y < LOCATOR_SIZE_MODULES) {
    return true
  }

  // Bottom-left locator
  if (x < LOCATOR_SIZE_MODULES && y >= originalSize - LOCATOR_SIZE_MODULES) {
    return true
  }

  return false
}

// Draw rounded rectangle helper function
const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) => {
  ctx.fillStyle = fillStyle
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

// Draw QR locators at three corners (EXACT Chromium DrawLocators implementation)
const drawLocators = (
  ctx: CanvasRenderingContext2D,
  dataSize: { width: number; height: number },
  paintForeground: { color: string },
  paintBackground: { color: string },
  margin: number,
  modulePixelSize: number
) => {
  const chromiumModuleSize = 10
  const scaleFactor = modulePixelSize / chromiumModuleSize
  const radius = 10 * scaleFactor

  const drawOneLocator = (leftXModules: number, topYModules: number) => {
    // Outermost square, 7x7 modules
    let leftXPixels = leftXModules * modulePixelSize
    let topYPixels = topYModules * modulePixelSize
    let dimPixels = modulePixelSize * LOCATOR_SIZE_MODULES

    drawRoundRect(
      ctx,
      margin + leftXPixels,
      margin + topYPixels,
      dimPixels,
      dimPixels,
      radius,
      paintForeground.color
    )

    // Middle square, one module smaller in all dimensions (5x5)
    leftXPixels += modulePixelSize
    topYPixels += modulePixelSize
    dimPixels -= 2 * modulePixelSize

    drawRoundRect(
      ctx,
      margin + leftXPixels,
      margin + topYPixels,
      dimPixels,
      dimPixels,
      radius,
      paintBackground.color
    )

    // Inner square, one additional module smaller in all dimensions (3x3)
    leftXPixels += modulePixelSize
    topYPixels += modulePixelSize
    dimPixels -= 2 * modulePixelSize

    drawRoundRect(
      ctx,
      margin + leftXPixels,
      margin + topYPixels,
      dimPixels,
      dimPixels,
      radius,
      paintForeground.color
    )
  }

  // Draw the three locators
  drawOneLocator(0, 0) // Top-left
  drawOneLocator(dataSize.width - LOCATOR_SIZE_MODULES, 0) // Top-right
  drawOneLocator(0, dataSize.height - LOCATOR_SIZE_MODULES) // Bottom-left
}

// Draw grayscale center icon image (firefox.png) preserving aspect ratio
const drawCenterIconImage = (
  ctx: CanvasRenderingContext2D,
  destX: number,
  destY: number,
  destWidth: number,
  destHeight: number
) => {
  if (!centerIconGrayCanvas) return
  const iw = centerIconGrayCanvas.width
  const ih = centerIconGrayCanvas.height
  if (iw === 0 || ih === 0) return

  const scale = Math.min(destWidth / iw, destHeight / ih)
  const w = Math.round(iw * scale)
  const h = Math.round(ih * scale)
  const x = Math.round(destX + (destWidth - w) / 2)
  const y = Math.round(destY + (destHeight - h) / 2)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(centerIconGrayCanvas, x, y, w, h)
}

// Paint center image background aligned to module grid and draw the center icon
const paintCenterImage = (
  ctx: CanvasRenderingContext2D,
  canvasBounds: { x: number; y: number; width: number; height: number },
  widthPx: number,
  heightPx: number,
  borderPx: number,
  paintBackground: { color: string },
  modulePixelSize: number
) => {
  if (
    canvasBounds.width / 2 < widthPx + borderPx ||
    canvasBounds.height / 2 < heightPx + borderPx
  ) {
    console.warn('Center image too large for canvas bounds')
    return
  }

  let destX = (canvasBounds.width - widthPx) / 2
  let destY = (canvasBounds.height - heightPx) / 2

  const backgroundLeft =
    Math.floor((destX - borderPx) / modulePixelSize) * modulePixelSize
  const backgroundTop =
    Math.floor((destY - borderPx) / modulePixelSize) * modulePixelSize
  const backgroundRight =
    Math.floor(
      (destX + widthPx + borderPx + modulePixelSize - 1) / modulePixelSize
    ) * modulePixelSize
  const backgroundBottom =
    Math.floor(
      (destY + heightPx + borderPx + modulePixelSize - 1) / modulePixelSize
    ) * modulePixelSize

  ctx.fillStyle = paintBackground.color
  ctx.fillRect(
    backgroundLeft,
    backgroundTop,
    backgroundRight - backgroundLeft,
    backgroundBottom - backgroundTop
  )

  const deltaX = Math.round(
    (backgroundLeft + backgroundRight) / 2 - (destX + widthPx / 2)
  )
  const deltaY = Math.round(
    (backgroundTop + backgroundBottom) / 2 - (destY + heightPx / 2)
  )
  destX += deltaX
  destY += deltaY

  // Draw the grayscale center icon within the computed box
  drawCenterIconImage(ctx, destX, destY, widthPx, heightPx)
}

// Draw center image (using firefox.png grayscale, sized like Chromium dino)
const drawCenterImage = (
  ctx: CanvasRenderingContext2D,
  canvasBounds: { x: number; y: number; width: number; height: number },
  paintBackground: { color: string },
  modulePixelSize: number
) => {
  const chromiumModuleSize = 10
  const scaleFactor = modulePixelSize / chromiumModuleSize
  const pixelsPerDinoTile = Math.round(DINO_TILE_SIZE_PIXELS * scaleFactor)
  const dinoWidthPx = pixelsPerDinoTile * kCenterTargetWidthTiles
  const dinoHeightPx = pixelsPerDinoTile * kCenterTargetHeightTiles
  const dinoBorderPx = Math.round(2 * scaleFactor)

  paintCenterImage(
    ctx,
    canvasBounds,
    dinoWidthPx,
    dinoHeightPx,
    dinoBorderPx,
    paintBackground,
    modulePixelSize
  )
}

const renderQRCodeToCanvasWithSize = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  qrData: Uint8Array,
  qrSize: number,
  originalSize: number
) => {
  const canvasSize =
    originalSize * MODULE_SIZE_PIXELS + QUIET_ZONE_SIZE_PIXELS * 2
  // Set canvas size to match original size with quiet zone
  canvas.height = canvas.width = canvasSize

  // Clear canvas with white background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // Enable high quality scaling
  ctx.imageSmoothingEnabled = false
  ctx.imageSmoothingQuality = 'high'

  renderQRCodeAtSize(ctx, canvasSize, qrData, qrSize, originalSize)
}

// Helper function to render QR code on canvas
export const renderQRCodeToCanvas = (
  canvas: HTMLCanvasElement,
  ...args: [Uint8Array, number, number]
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // Set canvas size to 240x240px
  canvas.style.height = canvas.style.width = '240px'

  renderQRCodeToCanvasWithSize(canvas, ctx, ...args)
}

// Render QR code at specific size (for download/copy) - exactly matching Chromium
const renderQRCodeAtSize = (
  ctx: CanvasRenderingContext2D,
  targetSize: number,
  pixelData: Uint8Array,
  size: number,
  originalSize: number
) => {
  // Clear canvas with white background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, targetSize, targetSize)

  // Calculate margin and module size exactly like Chromium's RenderBitmap
  const margin = QUIET_ZONE_SIZE_PIXELS // 40 pixels fixed margin
  const modulePixelSize = MODULE_SIZE_PIXELS // 10 pixels per module

  // Setup paint styles exactly like Chromium
  const paintBlack = { color: moduleColor }
  const paintWhite = { color: backgroundColor }

  // Check if we have quiet zone in our data
  const hasQuietZone = size > originalSize
  const quietZoneModules = hasQuietZone ? (size - originalSize) / 2 : 0

  // First pass: Draw data modules (matching Chromium's loop exactly)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dataIndex = y * size + x
      if (pixelData[dataIndex] & 0x1) {
        let originalX: number, originalY: number
        if (hasQuietZone) {
          originalX = x - quietZoneModules
          originalY = y - quietZoneModules
          if (
            originalX < 0 ||
            originalY < 0 ||
            originalX >= originalSize ||
            originalY >= originalSize
          ) {
            continue
          }
        } else {
          originalX = x
          originalY = y
        }

        // Skip locator modules - they will be drawn separately
        const isLocator = isLocatorModule(originalX, originalY, originalSize)
        if (isLocator) continue

        // Draw circle module exactly like Chromium
        const centerX = margin + (originalX + 0.5) * modulePixelSize
        const centerY = margin + (originalY + 0.5) * modulePixelSize
        const radius = modulePixelSize / 2 - 1

        ctx.fillStyle = paintBlack.color
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  // Draw locators exactly like Chromium
  drawLocators(
    ctx,
    { width: originalSize, height: originalSize },
    paintBlack,
    paintWhite,
    margin,
    modulePixelSize
  )

  // Draw center image; if icon not ready yet, schedule draw after load
  const canvasBounds = { x: 0, y: 0, width: targetSize, height: targetSize }
  if (centerIconGrayCanvas) {
    drawCenterImage(ctx, canvasBounds, paintWhite, modulePixelSize)
  } else {
    // kick off preload and draw upon ready
    ensureCenterIconReady().then(() => {
      drawCenterImage(ctx, canvasBounds, paintWhite, modulePixelSize)
    })
  }
}
