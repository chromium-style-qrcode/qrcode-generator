import { useEffect, type ReactNode } from 'react'

import { useDarkMode } from '@/src/hooks/use-dark-mode'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const isDarkMode = useDarkMode()

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  return children
}
