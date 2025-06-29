import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    default_locale: 'en',
    permissions: ['activeTab'],
    action: { default_popup: 'popup/index.html' },
    name: 'Next QR Code Generator',
    description:
      'A addon to generate Chromium-style QR codes featuring the iconic Firefox logo',
    commands: {
      'show-qrcode': {
        suggested_key: {
          default: 'Alt+Shift+Q',
          mac: 'Alt+Shift+Q'
        },
        description: 'Show QR code for current page'
      }
    },
    web_accessible_resources: [
      {
        resources: ['wasm/*'],
        matches: ['<all_urls>']
      }
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
    }
  },
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  entrypointsDir: 'src',
  webExt: { disabled: true },
  vite: () => ({
    server: {
      fs: {
        allow: ['..']
      }
    },
    assetsInclude: ['**/*.wasm']
  }),
  zip: {
    artifactTemplate: '{{name}}-{{packageVersion}}-{{browser}}.zip',
    sourcesTemplate: '{{name}}-{{packageVersion}}-{{browser}}-sources.zip'
  }
})
