// Static WASM loader that directly imports the generated module
import * as wasmModule from '../../public/wasm/generator.js'

export interface QRCodeResult {
  data: Uint8Array
  size: number
  original_size: number
}

export interface WasmQRGenerator {
  QuietZone: {
    WillBeAddedByClient: number
    Included: number
  }
  CenterImage: {
    Dino: number
    None: number
  }
  ModuleStyle: {
    Circles: number
    Squares: number
  }
  LocatorStyle: {
    Rounded: number
    Square: number
  }
  generate_qr_code_with_options: (
    text: string,
    moduleStyle: number,
    locatorStyle: number,
    centerImage: number,
    quietZone: number
  ) => QRCodeResult
}

let cachedModule: WasmQRGenerator | null = null

export const loadWasmModuleStatic = async (): Promise<WasmQRGenerator> => {
  if (cachedModule) {
    return cachedModule
  }

  try {
    // Get the correct WASM file path
    const getResourceUrl = (path: string) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome.runtime.getURL(path)
      }
      return path.startsWith('/') ? path : `/${path}`
    }

    const wasmPath = getResourceUrl('wasm/generator_bg.wasm')

    // Initialize the WASM module
    await wasmModule.default(wasmPath)

    console.log('WASM module loaded successfully via static import')

    cachedModule = {
      QuietZone: {
        WillBeAddedByClient: wasmModule.QuietZone.WillBeAddedByClient,
        Included: wasmModule.QuietZone.Included
      },
      CenterImage: {
        Dino: wasmModule.CenterImage.Dino,
        None: wasmModule.CenterImage.NoCenterImage
      },
      ModuleStyle: {
        Circles: wasmModule.ModuleStyle.Circles,
        Squares: wasmModule.ModuleStyle.Squares
      },
      LocatorStyle: {
        Rounded: wasmModule.LocatorStyle.Rounded,
        Square: wasmModule.LocatorStyle.Square
      },
      generate_qr_code_with_options: (
        text: string,
        moduleStyle: number,
        locatorStyle: number,
        centerImage: number,
        quietZone: number
      ) => {
        const result = wasmModule.generate_qr_code_with_options(
          text,
          moduleStyle,
          locatorStyle,
          centerImage,
          quietZone
        )

        return {
          data: result.data,
          size: result.size,
          original_size: result.original_size
        }
      }
    }

    return cachedModule
  } catch (error) {
    console.warn('Static WASM import failed:', error)
    throw error
  }
}
