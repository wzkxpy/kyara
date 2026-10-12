<script setup lang="ts">
import { onMounted, ref } from 'vue'
import HomeView from './pages/HomePage.vue'
import GameView from './pages/GamePage.vue'
import GalleryView from './pages/GalleryPage.vue'
import SavesView from './pages/SaveLoadPage.vue'
import SettingsView from './pages/SettingsPage.vue'
import { useSettingsStore } from '@renderer/stores/settings'

// 当前界面状态
type Screen = 'home' | 'game' | 'gallery' | 'saves' | 'settings'
const currentScreen = ref<Screen>('home')
const settingsFromHome = ref(false)

// 启动时加载一次设置，供全局使用
const settingsStore = useSettingsStore()

onMounted(() => {
  void settingsStore.loadSettings()
})

// 记录设置页是否从主界面进入，决定是否显示“回到游戏”
const openSettingsFromHome = (): void => {
  settingsFromHome.value = true
  currentScreen.value = 'settings'
}

const openSettingsFromGame = (): void => {
  settingsFromHome.value = false
  currentScreen.value = 'settings'
}
</script>

<template>
  <HomeView
    v-if="currentScreen === 'home'"
    @start="currentScreen = 'game'"
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
    @home="currentScreen = 'home'"
  />
</template>
