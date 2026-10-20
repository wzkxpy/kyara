<!-- src/renderer/pages/GamePage.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'

import GameScreen from '@renderer/components/GameScreen.vue'
import DialogueBox from '@renderer/components/DialogueBox.vue'
import DialogueHistoryOverlay from '@renderer/components/HistoryOverlay.vue'
import GameActionBar from '@renderer/components/ActionBar.vue'
import ConfirmDialog from '@renderer/components/ConfirmDialog.vue'

import { useSettingsStore } from '@renderer/stores/settings'
import { useGameSessionStore } from '@renderer/stores/gameSession'
import { useSaveLoad } from '@renderer/composables/useSaveLoad'

import { collectHistory, type HistoryEntry } from '@renderer/lib/history'
import { textCharIntervalMs } from '@renderer/lib/timing'

import avatarImage from '../../../resources/images/characters/avatar-example.svg'

const session = useGameSessionStore()
const { state: gameState, commands } = storeToRefs(session)
const { settings } = storeToRefs(useSettingsStore())
const { loadGame, saveGame } = useSaveLoad()

const props = withDefaults(defineProps<{ showFullTextOnMount?: boolean }>(), {
  showFullTextOnMount: false
})

const emit = defineEmits<{ settings: []; save: []; load: [] }>()

const isCapturing = ref(false) // 截图中，隐藏对话框和操作栏并阻止游戏交互

const isHistoryVisible = ref(false) // 历史记录 overlay 显示状态
const historyEntries = shallowRef<HistoryEntry[]>([]) // 历史页快照，打开时重新生成
const isDialogueVisible = ref(true) // 对话框显示状态

// 自动模式状态与单计时器
const isAutoActive = ref(false)
let autoTimer: ReturnType<typeof setTimeout> | null = null
let pendingVoiceAdvance = false // 自动计时已到点，等待语音播完

// 快速存读档的二次确认弹窗
const showQuickSaveConfirm = ref(false)
const showQuickLoadConfirm = ref(false)

// 待确认的历史回跳目标
const pendingHistoryJump = ref<number | null>(null)

// 对话框组件引用
const dialogueBoxRef = ref<InstanceType<typeof DialogueBox> | null>(null)
// 对话框显示状态切换
const toggleDialogueVisibility = (): void => {
  isDialogueVisible.value = !isDialogueVisible.value
}

// 自动模式基准与单字时长（1-100 指数映射）
const AUTO_BASE_SLOWEST_MS = 1200
const AUTO_BASE_FASTEST_MS = 250
const AUTO_CHAR_SLOWEST_MS = 150
const AUTO_CHAR_FASTEST_MS = 15
const AUTO_MIN_POST_TEXT_MS = 300 // 文本显示完成后的最短停留
const AUTO_VOICE_END_GAP_MS = 150 // 语音结束后的缓冲

// 自动模式在这些状态下暂停计时
const isAutoPaused = computed(
  () =>
    isCapturing.value ||
    isHistoryVisible.value ||
    !isDialogueVisible.value ||
    showQuickSaveConfirm.value ||
    showQuickLoadConfirm.value ||
    pendingHistoryJump.value !== null
)

const clearAutoTimer = (): void => {
  if (autoTimer !== null) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
}

const stopAuto = (): void => {
  isAutoActive.value = false
  pendingVoiceAdvance = false
  clearAutoTimer()
}

// 自动节奏 = 基准 + 字数 × 单字时长，再与「打字完成 + 最短停留」取较大值
const autoDelayMs = (): number => {
  const chars = Array.from(gameState.value?.text ?? '').length
  const speed = Math.min(100, Math.max(1, settings.value.autoSpeed))
  const progress = (speed - 1) / 99
  const autoBaseMs =
    AUTO_BASE_SLOWEST_MS * (AUTO_BASE_FASTEST_MS / AUTO_BASE_SLOWEST_MS) ** progress
  const autoCharMs =
    AUTO_CHAR_SLOWEST_MS * (AUTO_CHAR_FASTEST_MS / AUTO_CHAR_SLOWEST_MS) ** progress
  const textCharMs = textCharIntervalMs(settings.value.textSpeed)
  return Math.max(autoBaseMs + chars * autoCharMs, chars * textCharMs + AUTO_MIN_POST_TEXT_MS)
}

const runAutoAdvance = (): void => {
  if (!isAutoActive.value || isAutoPaused.value) return
  if (session.isVoicePlaying) {
    pendingVoiceAdvance = true
    return
  }
  session.advance()
}

const scheduleAuto = (): void => {
  clearAutoTimer()
  pendingVoiceAdvance = false
  if (!isAutoActive.value || isAutoPaused.value || gameState.value?.finished) return

  autoTimer = setTimeout(() => {
    autoTimer = null
    runAutoAdvance()
  }, autoDelayMs())
}

const toggleAuto = (): void => {
  if (isAutoActive.value) {
    stopAuto()
    return
  }
  if (gameState.value?.finished) return
  isAutoActive.value = true
  scheduleAuto()
}

// 推进剧情：正在逐字显示时先补全文字，否则进入下一条剧情
const advance = (): void => {
  if (isCapturing.value) return
  const dialogueBox = dialogueBoxRef.value
  if (dialogueBox?.isTyping) {
    dialogueBox.finish()
    return
  }
  pendingVoiceAdvance = false // 手动推进优先于等待语音
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

// 右键：自动模式下退出自动，否则切换对话框显示状态
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  if (isCapturing.value || isHistoryVisible.value) return

  if (isAutoActive.value) {
    stopAuto()
    return
  }

  toggleDialogueVisibility()
}

// 键盘事件：空格或回车推进剧情，Esc 退出自动/关闭历史/隐藏对话框
const handleKeydown = (event: KeyboardEvent): void => {
  if (isCapturing.value) return
  if (
    showQuickSaveConfirm.value ||
    showQuickLoadConfirm.value ||
    pendingHistoryJump.value !== null
  ) {
    return
  }
  if (isHistoryVisible.value) {
    if (event.key === 'Escape') {
      isHistoryVisible.value = false
    }
    return
  }

  if (event.key === 'Escape') {
    if (isAutoActive.value) {
      stopAuto()
      return
    }
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
  clearAutoTimer()
})

// 换行（含手动推进）时按新行重新计时
watch(
  () => gameState.value?.pc,
  () => {
    if (isAutoActive.value) scheduleAuto()
  }
)

// 暂停状态变化：暂停时清计时，恢复后按当前行重算
watch(isAutoPaused, (paused) => {
  if (paused) {
    clearAutoTimer()
    pendingVoiceAdvance = false
    return
  }
  scheduleAuto()
})

// 语音结束后执行挂起的推进
watch(
  () => session.isVoicePlaying,
  (playing) => {
    if (playing || !pendingVoiceAdvance) return
    pendingVoiceAdvance = false
    if (!isAutoActive.value || isAutoPaused.value) return
    clearAutoTimer()
    autoTimer = setTimeout(() => {
      autoTimer = null
      runAutoAdvance()
    }, AUTO_VOICE_END_GAP_MS)
  }
)

// 脚本播完后关闭自动
watch(
  () => gameState.value?.finished,
  (finished) => {
    if (finished) stopAuto()
  }
)

const openHistory = (): void => {
  const current = gameState.value
  // 最多展示最近 300 条
  historyEntries.value = current ? collectHistory(commands.value, current.pc, 300) : []
  isHistoryVisible.value = true
}

// 点击历史行跳转按钮：记录目标并弹出确认
const requestHistoryJump = (commandIndex: number): void => {
  pendingHistoryJump.value = commandIndex
}

// 确认回跳：执行跳转并关闭历史，目标文本随后正常逐字显示
const confirmHistoryJump = (): void => {
  const commandIndex = pendingHistoryJump.value
  pendingHistoryJump.value = null
  if (commandIndex === null) return

  stopAuto()
  session.jumpTo(commandIndex)
  isHistoryVisible.value = false
}

// 取消回跳：仅关闭确认框，历史页保持打开
const cancelHistoryJump = (): void => {
  pendingHistoryJump.value = null
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
  stopAuto()
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
  if (key === 'auto') {
    toggleAuto()
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
    <GameScreen :scene="gameState.scene" :characters="gameState.characters" />

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
          :auto-active="isAutoActive"
          @action="handleAction"
        />
      </DialogueBox>
    </footer>

    <DialogueHistoryOverlay
      :open="isHistoryVisible"
      :entries="historyEntries"
      @jump="requestHistoryJump"
      @close="isHistoryVisible = false"
    />

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

    <ConfirmDialog
      v-if="!isCapturing"
      :open="pendingHistoryJump !== null"
      message="确认要回跳到这条记录吗？"
      @confirm="confirmHistoryJump"
      @cancel="cancelHistoryJump"
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
