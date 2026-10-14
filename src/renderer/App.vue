<script setup lang="ts">
import { onMounted, ref } from 'vue'

import HomeView from './pages/HomePage.vue'
import GameView from './pages/GamePage.vue'
import GalleryView from './pages/GalleryPage.vue'
import SavesView from './pages/SaveLoadPage.vue'
import SettingsView from './pages/SettingsPage.vue'

import { useSettingsStore } from '@renderer/stores/settings'
import { useGameSessionStore } from '@renderer/stores/gameSession'

import type { Command } from '@shared/types/command'
import type { SaveData } from '@shared/types/savedata'
import script from '../../resources/scripts/chap01.json'

// 当前界面状态
type Screen = 'home' | 'game' | 'gallery' | 'saves' | 'settings'

const currentScreen = ref<Screen>('home')

const settingsFromHome = ref(false)
// 存档/读档界面的模式与来源，返回时按来源跳转
const savesMode = ref<'save' | 'load'>('load')
const savesFromHome = ref(false)

// Store
const settingsStore = useSettingsStore()
const session = useGameSessionStore()

// 启动时加载一次设置
onMounted(() => {
  void settingsStore.loadSettings()
})

// 音频资源路径解析
const resolveAudio = (type: 'bgm' | 'voice' | 'sfx', name: string): string =>
  `/resources/${type}/${name}.ogg`

// 开始新游戏
const startNewGame = (): void => {
  session.startGame(script.commands as Command[], resolveAudio)
  currentScreen.value = 'game'
}

// 读档完成，恢复游戏会话并进入游戏界面
const handleSavesLoaded = (data: SaveData): void => {
  session.startGame(script.commands as Command[], resolveAudio, data.state)
  currentScreen.value = 'game'
}

// 从主界面进入设置
const openSettingsFromHome = (): void => {
  settingsFromHome.value = true
  currentScreen.value = 'settings'
}

// 从游戏界面进入设置
const openSettingsFromGame = (): void => {
  settingsFromHome.value = false
  currentScreen.value = 'settings'
}

// 从主界面进入读档界面
const openSavesFromHome = (): void => {
  savesMode.value = 'load'
  savesFromHome.value = true
  currentScreen.value = 'saves'
}

// 从游戏界面进入存档/读档界面
const openSavesFromGame = (mode: 'save' | 'load'): void => {
  savesMode.value = mode
  savesFromHome.value = false
  currentScreen.value = 'saves'
}

// 从存档/读档界面返回来源页面
const backFromSaves = (): void => {
  currentScreen.value = savesFromHome.value ? 'home' : 'game'
}

// 退出当前游戏，返回主界面
const returnToHome = (): void => {
  session.endGame()
  currentScreen.value = 'home'
}
</script>

<template>
  <HomeView
    v-if="currentScreen === 'home'"
    @start="startNewGame"
    @load="openSavesFromHome"
    @gallery="currentScreen = 'gallery'"
    @settings="openSettingsFromHome"
  />
  <GameView
    v-else-if="currentScreen === 'game'"
    @settings="openSettingsFromGame"
    @save="openSavesFromGame('save')"
    @load="openSavesFromGame('load')"
  />
  <GalleryView v-else-if="currentScreen === 'gallery'" @back="currentScreen = 'home'" />
  <SavesView
    v-else-if="currentScreen === 'saves'"
    :mode="savesMode"
    @back="backFromSaves"
    @loaded="handleSavesLoaded"
  />
  <SettingsView
    v-else-if="currentScreen === 'settings'"
    :from-home="settingsFromHome"
    @game="currentScreen = 'game'"
    @home="returnToHome"
  />
</template>
