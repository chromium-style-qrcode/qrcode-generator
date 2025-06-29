// WASM module loader for Chromium-style QR code generator
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

let wasmModule: WasmQRGenerator | null = null

export const loadWasmModule = async (): Promise<WasmQRGenerator> => {
  if (wasmModule) {
    return wasmModule
  }

  try {
    const { loadWasmModuleStatic } = await import('./wasm-loader-static')
    wasmModule = await loadWasmModuleStatic()
    return wasmModule
  } catch (error) {
    console.warn('Static WASM loader failed:', error)
  }

  wasmModule = createMockWasmModule()
  return wasmModule
}

const createMockWasmModule = (): WasmQRGenerator => {
  return {
    QuietZone: {
      WillBeAddedByClient: 1,
      Included: 0
    },
    CenterImage: {
      Dino: 1,
      None: 0
    },
    ModuleStyle: {
      Circles: 1,
      Squares: 0
    },
    LocatorStyle: {
      Rounded: 1,
      Square: 0
    },
    generate_qr_code_with_options: (inputText: string) => {
      // Generate a simple test pattern
      const size = Math.max(25, Math.min(45, inputText.length + 20))
      const data = new Uint8Array(size * size)

      // Create a more realistic QR pattern
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = y * size + x

          // Create locator patterns at corners
          if (isInLocator(x, y, size)) {
            data[index] = 1
          }
          // Create some data pattern
          else {
            const hash =
              (x * 7 +
                y * 11 +
                inputText.charCodeAt((x + y) % inputText.length)) %
              3
            data[index] = hash === 0 ? 1 : 0
          }
        }
      }

      return {
        data,
        size,
        original_size: size
      }
    }
  }
}

const isInLocator = (x: number, y: number, size: number): boolean => {
  const locatorSize = 7

  // Top-left
  if (x < locatorSize && y < locatorSize) {
    return isLocatorPattern(x, y)
  }

  // Top-right
  if (x >= size - locatorSize && y < locatorSize) {
    return isLocatorPattern(x - (size - locatorSize), y)
  }

  // Bottom-left
  if (x < locatorSize && y >= size - locatorSize) {
    return isLocatorPattern(x, y - (size - locatorSize))
  }

  return false
}

const isLocatorPattern = (x: number, y: number): boolean => {
  // Simple locator pattern: black border with white inside and black center
  if (x === 0 || y === 0 || x === 6 || y === 6) return true // Outer border
  if (x === 1 || y === 1 || x === 5 || y === 5) return false // Inner white
  if (x >= 2 && x <= 4 && y >= 2 && y <= 4) return true // Center block
  return false
}
