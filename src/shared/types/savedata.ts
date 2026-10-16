import type { GameState } from './state'

export interface SaveMetadata {
  slotId: number
  timestamp: number
  previewText: string
  screenshot: string
}

export interface SaveData {
  metadata: SaveMetadata
  state: GameState
}
