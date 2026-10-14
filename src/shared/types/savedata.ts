import type { GameState } from './state'

export interface SaveMetadata {
  slotId: number
  timestamp: number
  screenshot: string | null
  previewText: string
}

export interface SaveData {
  metadata: SaveMetadata
  state: GameState
}
