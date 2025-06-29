declare global {
  interface Window {
    chrome?: {
      tabs: {
        query: (
          queryInfo: { active: boolean; currentWindow: boolean },
          callback: (tabs: Array<{ url?: string }>) => void
        ) => void
      }
      runtime?: {
        getURL: (path: string) => string
      }
      commands?: {
        onCommand: {
          addListener: (callback: (command: string) => void) => void
        }
      }
      action?: {
        openPopup: () => void
      }
    }
  }

  const chrome: {
    tabs: {
      query: (
        queryInfo: { active: boolean; currentWindow: boolean },
        callback: (tabs: Array<{ url?: string }>) => void
      ) => void
    }
    runtime?: {
      getURL: (path: string) => string
    }
    commands?: {
      onCommand: {
        addListener: (callback: (command: string) => void) => void
      }
    }
    action?: {
      openPopup: () => void
    }
  }
}

export {}
