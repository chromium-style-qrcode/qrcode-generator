import { useRef, useEffect, forwardRef } from 'react'

import { ErrorType, renderQRCodeToCanvas } from '@/src/hooks/use-qrcode'

interface QRCodeCanvasProps
  extends Partial<{
    isLoading: boolean
    error: string | null
    errorType: string | null
  }> {
  qrSize: number
  originalSize: number
  qrData: Uint8Array | null
}

export const QRCodeCanvas = forwardRef<HTMLCanvasElement, QRCodeCanvasProps>(
  ({ error, qrData, qrSize, errorType, isLoading, originalSize }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      if (qrData && qrSize > 0) {
        renderQRCodeToCanvas(canvas, qrData, qrSize, originalSize)
        return
      }
      // Clear canvas with white background (matching Chromium)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = 240

      canvas.height = canvas.width = size
      canvas.style.height = canvas.style.width = `${size}px`
      ctx.fillStyle = '#FFFFFF' // White background matching Chromium
      ctx.fillRect(0, 0, size, size)
    }, [qrData, qrSize, originalSize])

    return (
      <>
        <canvas
          className='qr-canvas'
          ref={(node) => {
            canvasRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
        />
        {/* Error overlay matching Chromium style */}
        {error && errorType !== ErrorType.InputTooLong && (
          <div className='absolute inset-0 flex items-center justify-center bg-white/90 p-2.5'>
            <p className='text-center text-xs leading-4 text-[#d93025]'>
              {error}
            </p>
          </div>
        )}
        {/* Loading overlay */}
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-white/75'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-[#1a73e8]'></div>
          </div>
        )}
      </>
    )
  }
)

QRCodeCanvas.displayName = 'QRCodeCanvas'
