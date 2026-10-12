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
import script from '../../resources/scripts/chap01.json'

// 当前界面状态
type Screen = 'home' | 'game' | 'gallery' | 'saves' | 'settings'

const currentScreen = ref<Screen>('home')
const settingsFromHome = ref(false)

// Store
const settingsStore = useSettingsStore()
const session = useGameSessionStore()

// 启动时加载一次设置
onMounted(() => {
  void settingsStore.loadSettings()
})

// 开始新游戏
const startNewGame = (): void => {
  session.startGame(script.commands as Command[], (type, name) => `/resources/${type}/${name}.ogg`)
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
    @load="currentScreen = 'saves'"
    @gallery="currentScreen = 'gallery'"
    @settings="openSettingsFromHome"
  />
  <GameView v-else-if="currentScreen === 'game'" @settings="openSettingsFromGame" />
  <GalleryView v-else-if="currentScreen === 'gallery'" @back="currentScreen = 'home'" />
  <SavesView v-else-if="currentScreen === 'saves'" @back="currentScreen = 'home'" />
  <SettingsView
    v-else-if="currentScreen === 'settings'"
    :from-home="settingsFromHome"
    @game="currentScreen = 'game'"
    @home="returnToHome"
  />
</template>
