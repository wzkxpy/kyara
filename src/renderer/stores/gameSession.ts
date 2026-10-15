// src/renderer/stores/gameSession.ts
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { GameState } from '@shared/types/state'
import { initState } from '../engine/GameState'
import { Runtime } from '../engine/Runtime'
import { AudioManager } from '../engine/AudioManager'
import { getAudioResolver, loadScript, DEFAULT_SCRIPT } from '../engine/resources'
import { useSettingsStore } from './settings'

export const useGameSessionStore = defineStore('gameSession', () => {
  const settingsStore = useSettingsStore()

  const state = ref<GameState | null>(null)
  let runtime: Runtime | null = null
  let audio: AudioManager | null = null

  // 开始游戏
  function startGame(scriptId: string = DEFAULT_SCRIPT, savedState?: GameState): void {
    endGame()
    const gameState = reactive(savedState ? structuredClone(savedState) : initState(scriptId))
    const audioManager = new AudioManager(getAudioResolver())
    const gameRuntime = new Runtime(
      loadScript(scriptId),
      gameState,
      audioManager,
      settingsStore.settings
    )
    state.value = gameState
    runtime = gameRuntime
    audio = audioManager
    if (savedState) {
      if (gameState.bgm) {
        audioManager.playBgm(gameState.bgm)
      }
    } else {
      gameRuntime.advance()
    }
  }

  // 推进剧情
  function advance(): void {
    runtime?.advance()
  }

  // 退出游戏到主界面
  function endGame(): void {
    audio?.dispose()
    state.value = null
    runtime = null
    audio = null
  }

  return {
    state,
    startGame,
    advance,
    endGame
  }
})
