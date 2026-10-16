// src/renderer/composables/useSaveLoad.ts
import { toRaw } from 'vue'
import { useGameSessionStore } from '@renderer/stores/gameSession'

import type { SaveData, SaveMetadata } from '@shared/types/savedata'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSaveLoad() {
  const session = useGameSessionStore()

  // 获取存档列表
  async function listSaves(): Promise<SaveMetadata[]> {
    return window.api.saves.list()
  }

  // 加载游戏存档
  async function loadGame(slotId: number): Promise<boolean> {
    const data = await window.api.saves.read(slotId)
    if (!data) return false
    session.loadGame(data.state)
    return true
  }

  // 保存游戏存档
  async function saveGame(slotId: number): Promise<SaveMetadata> {
    if (!session.state) {
      throw new Error('No active game session')
    }
    const state = structuredClone(toRaw(session.state))
    const timestamp = Date.now()
    const data: SaveData = {
      metadata: {
        slotId,
        timestamp,
        previewText: state.text,
        screenshot: `image://screenshot/save${slotId}.jpg?v=${timestamp}`
      },
      state
    }
    return window.api.saves.write(data)
  }

  return {
    listSaves,
    loadGame,
    saveGame
  }
}
