/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QRCODE_SHORTCUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
