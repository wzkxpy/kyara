// src/renderer/stores/gameSession.ts
import { defineStore } from 'pinia'
import { reactive, ref, shallowRef } from 'vue'

import type { Command } from '@shared/types/command'
import type { GameState } from '@shared/types/state'

import { initState } from '../engine/GameState'
import { Runtime } from '../engine/Runtime'
import { AudioManager } from '../engine/AudioManager'
import { useSettingsStore } from './settings'

export const useGameSessionStore = defineStore('gameSession', () => {
  const settingsStore = useSettingsStore()

  const state = ref<GameState | null>(null)
  const runtime = shallowRef<Runtime | null>(null)
  const audio = shallowRef<AudioManager | null>(null)

  // 开始游戏
  function startGame(
    commands: Command[],
    resolveAudio: ConstructorParameters<typeof AudioManager>[0],
    savedState?: GameState
  ): void {
    endGame() // 如果已有游戏会话，先销毁

    const gameState = reactive(savedState ? structuredClone(savedState) : initState())
    const audioManager = new AudioManager(resolveAudio)
    const gameRuntime = new Runtime(commands, gameState, audioManager, settingsStore.settings)

    state.value = gameState
    runtime.value = gameRuntime
    audio.value = audioManager

    if (savedState) {
      // 读档：恢复 BGM，不推进剧情
      if (gameState.bgm) {
        audioManager.playBgm(gameState.bgm)
      }
    } else {
      // 新游戏：执行到第一句对话
      gameRuntime.advance()
    }
  }

  // 推进剧情
  function advance(): void {
    runtime.value?.advance()
  }

  // 退出游戏到主界面
  function endGame(): void {
    audio.value?.dispose()

    state.value = null
    runtime.value = null
    audio.value = null
  }

  return {
    state,
    runtime,
    audio,
    startGame,
    advance,
    endGame
  }
})
