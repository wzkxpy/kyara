// src/renderer/stores/gameSession.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import type { Command } from '@shared/types/command'
import type { GameState } from '@shared/types/state'
import { getResourceUrl } from '@shared/resources'
import { initState } from '../engine/GameState'
import { Runtime } from '../engine/Runtime'
import { AudioManager, type AudioVolumes } from '../engine/AudioManager'
import { getCommands, DEFAULT_SCRIPT } from '../engine/ScriptRepository'
import { useSettingsStore } from './settings'

export const useGameSessionStore = defineStore('gameSession', () => {
  const settingsStore = useSettingsStore()

  const state = ref<GameState | null>(null)
  const isVoicePlaying = ref(false)
  let runtime: Runtime | null = null
  let audio: AudioManager | null = null

  const readVolumes = (): AudioVolumes => {
    const settings = settingsStore.settings
    return {
      master: settings.masterVolume,
      music: settings.musicVolume,
      voice: settings.voiceVolume,
      sfx: settings.sfxVolume
    }
  }

  // 设置页调整音量时，实时应用到正在播放的音频
  watch(
    () => [
      settingsStore.settings.masterVolume,
      settingsStore.settings.musicVolume,
      settingsStore.settings.voiceVolume,
      settingsStore.settings.sfxVolume
    ],
    () => audio?.setVolumes(readVolumes())
  )

  // 当前脚本命令，随 scriptId 更新
  const commands = computed<readonly Command[]>(() => {
    const current = state.value
    return current ? getCommands(current.scriptId) : []
  })

  // 组装会话，新游戏与读档共用，不在此推进剧情。
  function initSession(initialState: GameState): void {
    endGame()
    const gameState = reactive(initialState)
    const audioManager = new AudioManager(
      (type, name) => getResourceUrl(type === 'voice' ? 'voices' : type, name),
      readVolumes(),
      (playing) => {
        isVoicePlaying.value = playing
      }
    )
    const gameRuntime = new Runtime(
      getCommands(gameState.scriptId),
      gameState,
      audioManager,
      settingsStore.settings
    )
    state.value = gameState
    runtime = gameRuntime
    audio = audioManager
  }

  // 开始新游戏
  function startGame(): void {
    initSession(initState(DEFAULT_SCRIPT))
    runtime?.advance()
  }

  // 读取存档
  function loadGame(savedState: GameState): void {
    initSession(structuredClone(savedState))
    if (savedState.bgm) audio?.playBgm(savedState.bgm)
  }

  // 推进一次剧情
  function advance(): void {
    runtime?.advance()
  }

  // 历史回跳
  function jumpTo(commandIndex: number): void {
    runtime?.jumpTo(commandIndex)
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
    commands,
    isVoicePlaying,
    startGame,
    loadGame,
    advance,
    jumpTo,
    endGame
  }
})
