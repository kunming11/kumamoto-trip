import { useCallback, useEffect, useState } from 'react'
import { MODE_STORAGE_KEY, type AppMode } from '../utils/backup'

function loadMode(): AppMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY)
    if (raw === 'go' || raw === 'plan') return raw
  } catch {
    /* ignore */
  }
  return 'plan'
}

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(() => loadMode())

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
    document.documentElement.dataset.mode = mode
  }, [mode])

  const setMode = useCallback((next: AppMode) => {
    setModeState(next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((m) => (m === 'plan' ? 'go' : 'plan'))
  }, [])

  return { mode, setMode, toggleMode, isGo: mode === 'go', isPlan: mode === 'plan' }
}
