<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, reactive } from 'vue'
import GameScreen from '@renderer/components/GameScreen.vue'
import DialogueBox from '@renderer/components/DialogueBox.vue'
import DialogueHistoryOverlay from '@renderer/components/HistoryOverlay.vue'
import GameActionBar from '@renderer/components/ActionBar.vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@renderer/stores/settings'
import avatarImage from '../../../../resources/images/characters/avatar-example.svg'

import type { ScriptCommand } from '@shared/types/command'
import { Runtime } from '@renderer/engine/Runtime'
import { initState } from '@renderer/engine/GameState'
import { AudioManager } from '@renderer/engine/AudioManager'

import script from '../../../../resources/scripts/chap01.json'

const gameState = reactive(initState())

const audioManager = new AudioManager((type, name) => `/resources/${type}/${name}.ogg`)
const runtime = new Runtime(script.commands as ScriptCommand[], gameState, audioManager)

// 游戏界面
const emit = defineEmits<{ settings: [] }>()

// 对话历史 overlay 显示状态
const isHistoryVisible = ref(false)

// 对话框显隐规则：右键或关闭按钮隐藏；隐藏后左键和右键均可重新显示
const isDialogueVisible = ref(true)
const toggleDialogueVisibility = (): void => {
  isDialogueVisible.value = !isDialogueVisible.value
}

const handleLeftClick = (event: MouseEvent): void => {
  // 操作栏按钮自身有功能，左键不应再触发对话框显隐
  if (event.target instanceof Element && event.target.closest('.game-action-root')) {
    return
  }
  // 对话框隐藏状态下左键重新显示
  if (!isDialogueVisible.value) {
    isDialogueVisible.value = true
  }
  // 对话框可见状态下左键点击执行下一条命令
  else {
    runtime.advance()
  }
}

const handleWheel = (event: WheelEvent): void => {
  // 对话框可见时上滑滚轮打开历史记录 overlay
  if (isDialogueVisible.value && event.deltaY < 0) {
    openHistory()
  }
  // 对话框可见时下滑滚轮执行下一条命令
  if (isDialogueVisible.value && event.deltaY > 0) {
    runtime.advance()
  }
}

const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  // 可见状态下右键隐藏；隐藏状态下右键重新显示
  isDialogueVisible.value = !isDialogueVisible.value
}

const handleKeydown = (event: KeyboardEvent): void => {
  // 对话历史 overlay 可见状态下按 Esc 关闭 overlay
  if (isHistoryVisible.value && event.key === 'Escape') {
    isHistoryVisible.value = false
  }
  // 对话框可见状态下按 Esc 隐藏对话框
  else if (event.key === 'Escape' && isDialogueVisible.value) {
    isDialogueVisible.value = false
  }
  // 对话框可见状态下按空格或回车执行下一条命令
  if (isDialogueVisible.value && (event.key === ' ' || event.key === 'Enter')) {
    runtime.advance()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown) // 按键事件监听
  runtime.advance() // 进入游戏后立即执行第一条命令
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown) // 移除按键事件监听
})

// 打开历史记录时临时隐藏对话框层，关闭后按原显隐状态恢复
const openHistory = (): void => {
  isHistoryVisible.value = true
}

const handleAction = (key: string): void => {
  if (key === 'history') {
    openHistory()
  }

  if (key === 'settings') {
    emit('settings')
  }

  if (key === 'close') {
    toggleDialogueVisibility()
  }
}

// 头像显示状态由全局设置控制
const { settings } = storeToRefs(useSettingsStore())
</script>

<template>
  <main class="page" @click="handleLeftClick" @wheel="handleWheel" @contextmenu="handleContextMenu">
    <GameScreen :scene="gameState.scene" />

    <footer class="dialogue-layer">
      <div v-show="isDialogueVisible && !isHistoryVisible" class="dialogue-stack">
        <DialogueBox
          :speaker-name="gameState.speaker"
          :avatar="avatarImage"
          :show-avatar="settings.showAvatar"
          :text="gameState.text"
        />
        <GameActionBar
          :interactive="isDialogueVisible && !isHistoryVisible"
          @action="handleAction"
        />
      </div>
    </footer>

    <DialogueHistoryOverlay :open="isHistoryVisible" @close="isHistoryVisible = false" />
  </main>
</template>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialogue-layer {
  position: absolute;
  right: 50%;
  bottom: max(1rem, env(safe-area-inset-bottom));
  transform: translateX(50%);
  z-index: 2;
  width: min(100% - 3rem, 960px);
}

.dialogue-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
}
</style>
