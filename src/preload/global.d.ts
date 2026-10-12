import type { ElectronAPI } from '@electron-toolkit/preload'
import type { Settings } from '../shared/types/settings'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      settings: {
        get: () => Promise<Settings>
        set: (settings: Settings) => Promise<Settings>
      }
      app: {
        quit: () => void
      }
    }
  }
}

export {}
