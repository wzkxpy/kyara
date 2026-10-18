<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { HistoryEntry } from '@renderer/lib/history'

const props = defineProps<{
  open?: boolean
  entries: HistoryEntry[]
}>()

const emit = defineEmits<{ close: [] }>()

const scrollRef = ref<HTMLElement | null>(null)

// 间隔小于该值的滚轮事件视为同一次连续滚动
const WHEEL_GESTURE_GAP_MS = 200
let lastWheelAt = 0

// 以事件发生前的滚动位置判断：刚滚到底的同一次事件不触发关闭
const isAtBottom = (element: HTMLElement): boolean =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= 1

const handleWheel = (event: WheelEvent): void => {
  if (!props.open) return

  const now = Date.now()
  const startsNewGesture = now - lastWheelAt > WHEEL_GESTURE_GAP_MS
  lastWheelAt = now

  if (event.deltaY <= 0) return
  const element = scrollRef.value
  if (!element || !isAtBottom(element)) return

  event.preventDefault()
  if (startsNewGesture) {
    emit('close')
  }
}

// 打开时直接定位到最新一条记录
watch(
  () => props.open,
  (open) => {
    if (!open) return
    lastWheelAt = 0
    void nextTick(() => {
      const element = scrollRef.value
      if (!element) return
      element.focus({ preventScroll: true })
      element.scrollTop = element.scrollHeight
    })
  }
)

// 历史记录界面右键直接关闭 overlay
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="history-fade">
      <div
        v-if="open"
        class="history-overlay"
        role="presentation"
        @wheel="handleWheel"
        @contextmenu="handleContextMenu"
      >
        <section class="history-panel" role="dialog" aria-modal="true" aria-label="历史记录">
          <header class="history-header">
            <h2>历史记录</h2>
          </header>

          <section ref="scrollRef" class="history-body" tabindex="-1">
            <div class="history-list">
              <article v-for="entry in entries" :key="entry.commandIndex" class="history-entry">
                <p v-if="entry.speaker" class="history-speaker">{{ entry.speaker }}</p>
                <p class="history-text" :class="{ 'is-narration': !entry.speaker }">
                  {{ entry.text }}
                </p>
              </article>
              <p v-if="entries.length === 0" class="history-empty">暂无历史记录</p>
            </div>
          </section>

          <footer class="history-footer">
            <button type="button" class="close-button" @click="emit('close')">回到游戏</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.history-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: var(--background);
}

.history-panel {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: transparent;
}

/* 固定不透明遮挡：缩小可见内容区域，滚轮仍可从遮罩位置穿透滚动 */
.history-panel::before,
.history-panel::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  pointer-events: none;
  background: var(--background);
}

.history-panel::before {
  top: 0;
  height: 4.5rem;
}

.history-panel::after {
  bottom: 0;
  height: 5rem;
}

.history-header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  padding: 1.1rem 1.35rem;
  pointer-events: none;
}

.history-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
  text-shadow:
    0 1px 2px var(--background),
    0 0 8px var(--background);
}

.close-button {
  appearance: none;
  pointer-events: auto;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(31, 36, 48, 0.12);
}

.history-footer {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.35rem;
  pointer-events: none;
}

.history-body {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.history-body:focus {
  outline: none;
}

.history-list {
  max-width: 760px;
  margin: 0 auto;
  padding: 4.5rem 1.35rem 5rem;
}

.history-entry {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  column-gap: 1rem;
  align-items: baseline;
}

.history-entry + .history-entry {
  margin-top: 4rem;
}

.history-speaker {
  grid-column: 1;
  overflow: hidden;
  color: var(--accent);
  font-size: 1.4rem;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.history-text {
  grid-column: 2;
  color: var(--text-primary);
  font-size: 1.5rem;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.history-text.is-narration {
  color: var(--text-secondary);
}

.history-empty {
  padding: 2rem 0;
  color: var(--text-secondary);
  text-align: center;
}

.history-fade-enter-active,
.history-fade-leave-active {
  transition: opacity 0.16s ease;
}

.history-fade-enter-active .history-panel,
.history-fade-leave-active .history-panel {
  transition: transform 0.16s ease;
}

.history-fade-enter-from,
.history-fade-leave-to {
  opacity: 0;
}

.history-fade-enter-from .history-panel,
.history-fade-leave-to .history-panel {
  transform: translateY(8px) scale(0.98);
}
</style>
