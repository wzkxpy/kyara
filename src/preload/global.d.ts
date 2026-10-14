// src/preload/global.d.ts
import type { ElectronAPI } from '@electron-toolkit/preload'
import type { Settings } from '../shared/types/settings'
import type { SaveData, SaveMetadata } from '../shared/types/savedata'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      settings: {
        get: () => Promise<Settings>
        set: (settings: Settings) => Promise<Settings>
      }
      saves: {
        list: () => Promise<SaveMetadata[]>
        read: (slotId: number) => Promise<SaveData | null>
        write: (data: SaveData) => Promise<void>
      }
      app: {
        quit: () => void
      }
    }
  }
}

export {}
