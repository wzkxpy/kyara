<script setup lang="ts">
import { ref } from 'vue'
import HomeView from './pages/HomePage.vue'
import GameView from './pages/GamePage.vue'
import SavesView from './pages/SaveLoadPage.vue'
import SettingsView from './pages/SettingsPage.vue'

// 当前界面状态
type Screen = 'home' | 'game' | 'saves' | 'settings'
const currentScreen = ref<Screen>('home')
</script>

<template>
  <HomeView
    v-if="currentScreen === 'home'"
    @start="currentScreen = 'game'"
    @load="currentScreen = 'saves'"
    @settings="currentScreen = 'settings'"
  />
  <GameView v-else-if="currentScreen === 'game'" @back="currentScreen = 'home'" />
  <SavesView v-else-if="currentScreen === 'saves'" @back="currentScreen = 'home'" />
  <SettingsView v-else-if="currentScreen === 'settings'" @back="currentScreen = 'home'" />
</template>
