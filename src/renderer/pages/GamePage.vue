<!-- src/renderer/pages/GamePage.vue -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import GameScreen from '@renderer/components/GameScreen.vue'
import DialogueBox from '@renderer/components/DialogueBox.vue'
import DialogueHistoryOverlay from '@renderer/components/HistoryOverlay.vue'
import GameActionBar from '@renderer/components/ActionBar.vue'

import { useSettingsStore } from '@renderer/stores/settings'
import { useGameSessionStore } from '@renderer/stores/gameSession'

import avatarImage from '../../../resources/images/characters/avatar-example.svg'

const session = useGameSessionStore()
const { state: gameState } = storeToRefs(session)
const { settings } = storeToRefs(useSettingsStore())

const props = withDefaults(defineProps<{ showFullTextOnMount?: boolean }>(), {
  showFullTextOnMount: false
})

// 游戏界面
const emit = defineEmits<{ settings: []; save: []; load: [] }>()

const isHistoryVisible = ref(false) // 历史记录 overlay 显示状态
const isDialogueVisible = ref(true) // 对话框显示状态

// 对话框组件引用
const dialogueBoxRef = ref<InstanceType<typeof DialogueBox> | null>(null)

const toggleDialogueVisibility = (): void => {
  isDialogueVisible.value = !isDialogueVisible.value
}

// 推进剧情：正在逐字显示时先补全文字，否则进入下一条剧情
const advance = (): void => {
  const dialogueBox = dialogueBoxRef.value
  if (dialogueBox?.isTyping) {
    dialogueBox.finish()
    return
  }
  session.advance()
}

const handleLeftClick = (event: MouseEvent): void => {
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

const handleWheel = (event: WheelEvent): void => {
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
  if (isHistoryVisible.value) return

  toggleDialogueVisibility()
}

const handleKeydown = (event: KeyboardEvent): void => {
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

const handleAction = (key: string): void => {
  if (key === 'history') {
    openHistory()
  }

  if (key === 'settings') {
    emit('settings')
  }

  if (key === 'save') {
    emit('save')
  }

  if (key === 'load') {
    emit('load')
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
          :interactive="isDialogueVisible && !isHistoryVisible"
          @action="handleAction"
        />
      </DialogueBox>
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
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}
</style>
