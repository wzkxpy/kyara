// src/renderer/composables/useSaveLoad.ts
import { toRaw } from 'vue'
import { useGameSessionStore } from '@renderer/stores/gameSession'

import type { GameState } from '@shared/types/state'
import type { SaveData, SaveMetadata } from '@shared/types/savedata'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSaveLoad() {
  const session = useGameSessionStore()

  function snapshotState(): GameState {
    if (!session.state) {
      throw new Error('No active game session')
    }
    return structuredClone(toRaw(session.state))
  }

  function createSaveData(slotId: number, state: GameState, screenshot: string): SaveData {
    return {
      metadata: {
        slotId,
        timestamp: Date.now(),
        screenshot, // 暂未实现
        previewText: state.text
      },
      state
    }
  }

  async function listSaves(): Promise<SaveMetadata[]> {
    return window.api.saves.list()
  }

  async function loadGame(slotId: number): Promise<SaveData | null> {
    return window.api.saves.read(slotId)
  }

  async function saveGame(data: SaveData): Promise<void> {
    await window.api.saves.write(data)
  }

  return {
    snapshotState,
    createSaveData,
    listSaves,
    loadGame,
    saveGame
  }
}
