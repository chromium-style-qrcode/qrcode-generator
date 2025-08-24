import { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { i18n } from '#i18n'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/src/components/ui/tooltip'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { QRCodeCanvas } from '@/src/components/ui/qrcode-canvas'

import { ErrorType, useQRCode } from '@/src/hooks/use-qrcode'

function App() {
  const [qrState, qrActions] = useQRCode()
  const [inputValue, setInputValue] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [copyFeedback, setCopyFeedback] = useState('')

  // Get current tab URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setInputValue(tabs[0].url)
        }
      })
    }

    setTimeout(() => {
      titleRef.current?.style.setProperty('visibility', 'visible')
    }, 50) // Delay to ensure title is visible after initial render
  }, [])

  // Generate QR code when input changes or configuration changes
  useEffect(() => {
    const timer = setTimeout(() => {
      qrActions.generateQRCode(inputValue)
    }, 300) // Debounce input

    return () => clearTimeout(timer)
  }, [inputValue, qrActions.generateQRCode])

  const handleCopy = async () => {
    if (qrState.qrData) {
      try {
        await qrActions.copyQRCode()
        setCopyFeedback(i18n.t('copied'))
        setTimeout(() => setCopyFeedback(''), 1500)
      } catch (error) {
        // Fallback to copying text
        try {
          await navigator.clipboard.writeText(inputValue)
          setCopyFeedback(i18n.t('copied'))
          setTimeout(() => setCopyFeedback(''), 1500)
        } catch (textError) {
          console.error('Failed to copy text:', textError)
        }
      }
    }
  }

  const handleDownload = () => {
    if (qrState.qrData) {
      let filename = 'qrcode_firefox.png'
      try {
        const url = new URL(inputValue)
        if (url.hostname && !/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) {
          const safeHostname = url.hostname.replace(/[^a-zA-Z0-9.-]/g, '_')
          filename = `qrcode_${safeHostname}.png`
        }
      } catch (e) {
        // Use default filename if URL parsing fails
      }
      qrActions.downloadQRCode(filename)
    }
  }

  const [
    { error, qrData, qrSize, errorType, isLoading, originalSize } = qrState,
    showInputLengthError = Boolean(error) &&
      errorType === ErrorType.InputTooLong,
    hasQRData = Boolean(qrData) && qrSize > 0,
    disabled = !hasQRData || Boolean(isLoading)
  ] = [] as unknown as []

  return (
    <div className={`chromium-bubble flex w-80 flex-col p-0 leading-5`}>
      {/* Title bar with close button - matching Chromium's ShouldShowCloseButton() = true */}
      <div className='chromium-title-bar flex min-h-10 items-center justify-between border-b border-b-transparent px-4 py-3'>
        <div className='flex items-center gap-2'>
          <h2 className='chromium-title text-sm font-medium' ref={titleRef}>
            {i18n.t('title')}
            {/* IDS_BROWSER_SHARING_QR_CODE_DIALOG_TITLE */}
          </h2>
          <span className='text-xs text-gray-500 opacity-70'>Alt+Shift+Q</span>
        </div>
        <button
          type='button'
          className='chromium-close-button flex h-6 w-6 items-center justify-center rounded-full focus:ring-2 focus:outline-none'
          aria-label={i18n.t('aria_close')}
          onClick={() => window.close()}
        >
          <svg
            className='h-4 w-4'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M18 6L6 18M6 6l12 12' />
          </svg>
        </button>
      </div>
      {/* QR code display area - exactly matching Chromium's kQRImageSizePx = 240 */}
      <div className='chromium-qr-container relative flex items-center justify-center self-center overflow-hidden border-2 bg-white'>
        <QRCodeCanvas
          {...{
            qrData,
            qrSize,
            errorType,
            isLoading,
            originalSize
          }}
          error={error && !showInputLengthError ? error : null}
          ref={canvasRef}
        />
      </div>
      {/* URL input textfield - matching Chromium's textfield with accessibility */}
      <div className='chromium-input-container'>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label={i18n.t('aria_input_url_text')} // GetStringUTF16(IDS_BROWSER_SHARING_QR_CODE_DIALOG_URL_TEXTFIELD_ACCESSIBLE_NAME)
          placeholder={i18n.t('placeholder_input_url_text')}
          maxLength={2000} // kMaxInputLength from Chromium
          className={`chromium-input text-sm transition-all focus:outline-none`}
        />
      </div>
      {/* Bottom error label for input too long */}
      <div
        className={clsx(
          'chromium-error-container',
          showInputLengthError ? 'show-error' : 'hide-error'
        )}
      >
        {showInputLengthError && (
          <div className='chromium-error-text text-left leading-4'>{error}</div>
        )}
      </div>
      {/* Button container - matching Chromium's BoxLayoutView with spacing */}
      <div
        className={clsx(
          'chromium-button-container flex items-center gap-2',
          showInputLengthError ? 'with-error' : 'without-error'
        )}
      >
        {/* Tooltip icon - matching Chromium's TooltipIcon */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='chromium-tooltip-icon flex items-center justify-center'>
                <InfoCircledIcon className='h-full w-full' />
              </div>
            </TooltipTrigger>
            <TooltipContent side='top' align='start'>
              <p className='chromium-tooltip-content'>{i18n.t('tips')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Flex spacer */}
        <div className='flex-1' />
        <Button
          disabled={disabled}
          className='chromium-button min-h-8 min-w-16 rounded-2xl border px-4 py-2 text-center leading-5 disabled:cursor-not-allowed'
          onClick={handleCopy}
        >
          {copyFeedback || i18n.t('copy')}
        </Button>
        <Button
          disabled={disabled}
          className='chromium-button min-h-8 min-w-16 rounded-2xl border px-4 py-2 text-center leading-5 disabled:cursor-not-allowed'
          onClick={handleDownload}
        >
          {i18n.t('download')}
        </Button>
      </div>
    </div>
  )
}

export default App
