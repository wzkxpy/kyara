<!-- src/renderer/pages/GamePage.vue -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import GameScreen from '@renderer/components/GameScreen.vue'
import DialogueBox from '@renderer/components/DialogueBox.vue'
import DialogueHistoryOverlay from '@renderer/components/HistoryOverlay.vue'
import GameActionBar from '@renderer/components/ActionBar.vue'
import ConfirmDialog from '@renderer/components/ConfirmDialog.vue'

import { useSettingsStore } from '@renderer/stores/settings'
import { useGameSessionStore } from '@renderer/stores/gameSession'
import { useSaveLoad } from '@renderer/composables/useSaveLoad'

import avatarImage from '../../../resources/images/characters/avatar-example.svg'

const session = useGameSessionStore()
const { state: gameState } = storeToRefs(session)
const { settings } = storeToRefs(useSettingsStore())
const { loadGame, saveGame } = useSaveLoad()

const props = withDefaults(defineProps<{ showFullTextOnMount?: boolean }>(), {
  showFullTextOnMount: false
})

const emit = defineEmits<{ settings: []; save: []; load: [] }>()

const isCapturing = ref(false) // 截图中，隐藏对话框和操作栏并阻止游戏交互

const isHistoryVisible = ref(false) // 历史记录 overlay 显示状态
const isDialogueVisible = ref(true) // 对话框显示状态

// 快速存读档的二次确认弹窗
const showQuickSaveConfirm = ref(false)
const showQuickLoadConfirm = ref(false)

// 对话框组件引用
const dialogueBoxRef = ref<InstanceType<typeof DialogueBox> | null>(null)
// 对话框显示状态切换
const toggleDialogueVisibility = (): void => {
  isDialogueVisible.value = !isDialogueVisible.value
}

// 推进剧情：正在逐字显示时先补全文字，否则进入下一条剧情
const advance = (): void => {
  if (isCapturing.value) return
  const dialogueBox = dialogueBoxRef.value
  if (dialogueBox?.isTyping) {
    dialogueBox.finish()
    return
  }
  session.advance()
}

// 左键点击事件
const handleLeftClick = (event: MouseEvent): void => {
  if (isCapturing.value) return
  // 操作栏按钮不触发翻页
  if (event.target instanceof Element && event.target.closest('.game-action-root')) {
    return
  }

  // 历史记录打开时不翻页
  if (isHistoryVisible.value) return

  // 对话框隐藏时左键重新显示
  if (!isDialogueVisible.value) {
    isDialogueVisible.value = true
    return
  }

  advance()
}

// 鼠标滚轮事件：向上滚动打开历史记录，向下滚动推进剧情
const handleWheel = (event: WheelEvent): void => {
  if (isCapturing.value) return
  if (isHistoryVisible.value) return
  if (!isDialogueVisible.value) return

  if (event.deltaY < 0) {
    openHistory()
  } else if (event.deltaY > 0) {
    advance()
  }
}

// 右键点击切换对话框显示状态
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  if (isCapturing.value || isHistoryVisible.value) return

  toggleDialogueVisibility()
}

// 键盘事件：空格或回车推进剧情，Esc 关闭对话框或历史记录
const handleKeydown = (event: KeyboardEvent): void => {
  if (isCapturing.value) return
  if (showQuickSaveConfirm.value || showQuickLoadConfirm.value) return
  if (isHistoryVisible.value) {
    if (event.key === 'Escape') {
      isHistoryVisible.value = false
    }
    return
  }

  if (event.key === 'Escape') {
    if (isDialogueVisible.value) {
      isDialogueVisible.value = false
    }
    return
  }

  if (isDialogueVisible.value && (event.key === ' ' || event.key === 'Enter')) {
    event.preventDefault()
    if (event.repeat) return // 避免长按按键时连续推进剧情
    advance()
  }
}

onMounted(() => {
  // 对话框已挂载，直接补全当前文本，不推进剧情。
  if (props.showFullTextOnMount) dialogueBoxRef.value?.finish()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const openHistory = (): void => {
  isHistoryVisible.value = true
}

// 等待隐藏界面后的画面完成绘制并截图，图片暂存于主进程供存档写入
const captureScreenshot = async (): Promise<void> => {
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }) // 等待两帧，确保对话框和操作栏已隐藏并完成绘制
  await window.api.saves.capture()
}

const openSavePage = async (): Promise<void> => {
  isCapturing.value = true
  await captureScreenshot()
  isCapturing.value = false
  emit('save')
}

// 快速存档：确认后截图并覆盖 0 号槽
const quickSave = async (): Promise<void> => {
  showQuickSaveConfirm.value = false
  isCapturing.value = true
  try {
    await captureScreenshot()
    await saveGame(0)
  } catch (error) {
    console.error('快速存档失败:', error)
  } finally {
    isCapturing.value = false
  }
}

// 快速读档：确认后就地恢复 0 号槽的会话状态
const quickLoad = async (): Promise<void> => {
  showQuickLoadConfirm.value = false
  isCapturing.value = true
  try {
    await loadGame(0)
  } catch (error) {
    console.error('快速读档失败:', error)
  } finally {
    isCapturing.value = false
  }
}

const handleAction = (key: string): void => {
  if (isCapturing.value) return
  if (key === 'history') {
    openHistory()
  }
  if (key === 'settings') {
    emit('settings')
  }
  if (key === 'save') {
    void openSavePage()
  }
  if (key === 'load') {
    emit('load')
  }
  if (key === 'quickSave') {
    showQuickSaveConfirm.value = true
  }
  if (key === 'quickLoad') {
    showQuickLoadConfirm.value = true
  }
  if (key === 'close') {
    toggleDialogueVisibility()
  }
}
</script>

<template>
  <main
    v-if="gameState"
    class="page"
    :class="{ 'is-capturing': isCapturing }"
    @click="handleLeftClick"
    @wheel="handleWheel"
    @contextmenu="handleContextMenu"
  >
    <GameScreen :scene="gameState.scene" />

    <footer class="dialogue-layer">
      <DialogueBox
        v-show="isDialogueVisible && !isHistoryVisible"
        ref="dialogueBoxRef"
        :speaker-name="gameState.speaker"
        :avatar="avatarImage"
        :show-avatar="settings.showAvatar"
        :text="gameState.text"
        :text-speed="settings.textSpeed"
      >
        <GameActionBar
          :interactive="isDialogueVisible && !isHistoryVisible && !isCapturing"
          @action="handleAction"
        />
      </DialogueBox>
    </footer>

    <DialogueHistoryOverlay :open="isHistoryVisible" @close="isHistoryVisible = false" />

    <ConfirmDialog
      v-if="!isCapturing"
      :open="showQuickSaveConfirm"
      message="确认要快速存档吗？"
      @confirm="quickSave"
      @cancel="showQuickSaveConfirm = false"
    />

    <ConfirmDialog
      v-if="!isCapturing"
      :open="showQuickLoadConfirm"
      message="确认要快速读档吗？"
      @confirm="quickLoad"
      @cancel="showQuickLoadConfirm = false"
    />
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

.is-capturing .dialogue-layer {
  visibility: hidden;
}

.dialogue-layer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}
</style>
