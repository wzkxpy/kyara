<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DialogueBox from '@renderer/components/DialogueBox.vue'
import GameActionBar from '@renderer/components/ActionBar.vue'
import { useAppSettings } from '@renderer/composables/useAppSettings'
import avatarImage from '../../../../resources/images/characters/avatar-example.svg'

// 游戏界面
const emit = defineEmits<{ history: []; settings: [] }>()

// 右键和关闭按钮共用同一套显示状态切换
const isDialogueVisible = ref(true)
const toggleDialogueVisibility = (): void => {
  isDialogueVisible.value = !isDialogueVisible.value
}

const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  toggleDialogueVisibility()
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

const handleAction = (key: string): void => {
  if (key === 'history') {
    emit('history')
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
  <main class="page" @contextmenu="handleContextMenu">
    <section class="placeholder">
      <p>游戏界面占位</p>
    </section>

    <footer class="dialogue-layer">
      <div v-show="isDialogueVisible" class="dialogue-stack">
        <DialogueBox
          speaker-name="示例角色"
          :avatar="avatarImage"
          :show-avatar="settings.showAvatar"
          text="这里是说话内容区域。右键点击界面可以隐藏对话框，再次右键点击可以重新显示。"
        />
        <GameActionBar class="action-bar" @action="handleAction" />
      </div>
    </footer>
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

.action-bar {
  align-self: flex-end;
  max-width: 100%;
}
</style>
