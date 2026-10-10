<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DialogueBox from '@renderer/components/DialogueBox.vue'
import DialogueHistoryOverlay from '@renderer/components/HistoryOverlay.vue'
import GameActionBar from '@renderer/components/ActionBar.vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import avatarImage from '../../../../resources/images/characters/avatar-example.svg'

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
  // 隐藏状态下左键重新显示
  if (!isDialogueVisible.value) {
    isDialogueVisible.value = true
  }
}

const handleWheel = (event: WheelEvent): void => {
  // 对话框可见时上滑滚轮打开历史记录 overlay
  if (isDialogueVisible.value && event.deltaY < 0) {
    openHistory()
  }
}

const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  // 可见状态下右键隐藏；隐藏状态下右键重新显示
  isDialogueVisible.value = !isDialogueVisible.value
}

// Esc 只负责隐藏，隐藏状态下不会再次显示
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isDialogueVisible.value) {
    isDialogueVisible.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
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
const { settings } = useAppSettings()
</script>

<template>
  <main class="page" @click="handleLeftClick" @wheel="handleWheel" @contextmenu="handleContextMenu">
    <section class="placeholder">
      <p>游戏界面占位</p>
    </section>

    <footer class="dialogue-layer">
      <div v-show="isDialogueVisible && !isHistoryVisible" class="dialogue-stack">
        <DialogueBox
          speaker-name="示例角色"
          :avatar="avatarImage"
          :show-avatar="settings.showAvatar"
          text="这里是说话内容区域。右键点击界面可以隐藏对话框，隐藏后点击左键或右键都可以重新显示。"
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

.placeholder {
  flex: 1;
  display: grid;
  place-content: center;
  color: var(--text-secondary);
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
