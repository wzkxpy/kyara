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
  async function saveGame(slotId: number, screenshot = ''): Promise<SaveMetadata> {
    if (!session.state) {
      throw new Error('No active game session')
    }
    const state = structuredClone(toRaw(session.state))
    const data: SaveData = {
      metadata: {
        slotId,
        timestamp: Date.now(),
        screenshot, // 截图捕获暂未实现
        previewText: state.text
      },
      state
    }
    await window.api.saves.write(data)
    return data.metadata
  }

  return {
    listSaves,
    loadGame,
    saveGame
  }
}
