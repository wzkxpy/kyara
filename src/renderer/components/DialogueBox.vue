<!-- src/renderer/components/DialogueBox.vue -->
<template>
  <section class="dialogue-box" aria-live="off">
    <img class="dialogue-body" :src="dialogueBoxImage" alt="" draggable="false" />

    <div v-if="showAvatar && avatar" class="dialogue-avatar">
      <img :src="avatar" alt="" draggable="false" />
    </div>

    <!-- 名牌绝对定位，不参与布局；文本区顶部固定为其预留高度 -->
    <div v-if="speakerName" class="dialogue-name">{{ speakerName }}</div>

    <div class="dialogue-content">
      <p class="dialogue-text">{{ displayedText }}</p>
    </div>

    <div v-if="$slots.default" class="dialogue-controls">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { resolveUiAsset } from '@renderer/lib/uiAssets'
import { useTypewriter } from '@renderer/composables/useTypewriter'

// 对话框框体通过 UI 资源槽位解析
const dialogueBoxImage = resolveUiAsset('dialog.box')

const props = withDefaults(
  defineProps<{
    speakerName: string | null
    avatar?: string
    text: string
    showAvatar?: boolean
    textSpeed?: number
  }>(),
  {
    avatar: '',
    showAvatar: true,
    textSpeed: 50
  }
)

// 显示速度（1-100）指数映射为每字间隔毫秒数：每档约 +3.5% 速度，滑杆手感均匀
const SLOWEST_INTERVAL_MS = 150 // speed=1：约 6.7 字/秒
const FASTEST_INTERVAL_MS = 5 // speed=100：约 200 字/秒
const intervalMs = computed(() => {
  const speed = Math.min(100, Math.max(1, props.textSpeed))
  return SLOWEST_INTERVAL_MS * (FASTEST_INTERVAL_MS / SLOWEST_INTERVAL_MS) ** ((speed - 1) / 99)
})

const { displayedText, isTyping, start, finish } = useTypewriter(intervalMs)

// 对话变化时重新开始逐字显示
watch(
  () => props.text,
  (newText) => {
    start(newText)
  },
  { immediate: true }
)

// 向父组件暴露打字状态和补全方法
defineExpose({
  isTyping,
  finish
})
</script>

<style scoped>
.dialogue-box {
  --dialogue-pad-x: clamp(1.5rem, 3vw, 3.25rem);
  --dialogue-pad-top: 1.15rem;
  --dialogue-avatar-size: 92px;
  --dialogue-name-height: 1.7rem;
  /* 名牌与文本共用的左右内边距：对称预留头像位与左右留白，不随头像显示状态变化 */
  --dialogue-inset-x: calc(var(--dialogue-pad-x) + var(--dialogue-avatar-size) + 2.5rem);
  /* 文本区顶部固定预留名牌占位，保证旁白/对话的文本起始位置一致 */
  --dialogue-name-zone: calc(var(--dialogue-pad-top) + var(--dialogue-name-height) + 0.45rem);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: clamp(200px, 30vh, 280px);
}

/* 全宽贴底的渐变框体，文字与控制行都叠在其上 */
.dialogue-body {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

.dialogue-avatar {
  position: absolute;
  top: calc((100% - 3.75rem) / 2);
  left: var(--dialogue-pad-x);
  transform: translateY(-50%);
  z-index: 2;
  width: var(--dialogue-avatar-size);
  height: var(--dialogue-avatar-size);
  border: 2px solid rgba(84, 104, 255, 0.45);
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 24px rgba(31, 36, 48, 0.14);
}

.dialogue-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialogue-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: var(--dialogue-name-zone) var(--dialogue-inset-x) 0.75rem;
}

.dialogue-name {
  position: absolute;
  top: var(--dialogue-pad-top);
  left: var(--dialogue-inset-x);
  z-index: 1;
  max-width: calc(100% - 2 * var(--dialogue-inset-x));
  height: var(--dialogue-name-height);
  line-height: calc(var(--dialogue-name-height) - 2px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border: 1px solid rgba(84, 104, 255, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  padding: 0 0.75rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dialogue-text {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 1.5rem;
  line-height: 1.7;
  white-space: pre-wrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
}

/* 底部控制行：默认插槽内容（操作栏等）叠加在框体之上 */
.dialogue-controls {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem var(--dialogue-pad-x) calc(0.5rem + env(safe-area-inset-bottom));
}
</style>
