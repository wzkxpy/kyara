import type { ElectronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../shared/types/settings'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      settings: {
        get: () => Promise<AppSettings>
        set: (settings: AppSettings) => Promise<AppSettings>
      }
      app: {
        quit: () => void
      }
    }
  }
}

export {}
