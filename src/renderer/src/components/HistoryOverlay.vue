<script setup lang="ts">
defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

// 历史记录界面右键直接关闭 overlay
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="history-fade">
      <div v-if="open" class="history-overlay" role="presentation" @contextmenu="handleContextMenu">
        <section class="history-panel">
          <header class="history-header">
            <h2>对话历史记录</h2>
          </header>

          <section class="history-body">
            <p>对话历史记录占位</p>
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
  background: var(--bg-primary);
}

.history-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.35rem;
  border-bottom: 1px solid rgba(84, 104, 255, 0.18);
}

.history-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-button {
  appearance: none;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.history-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.35rem;
}

.history-body {
  flex: 1;
  display: grid;
  place-content: center;
  color: var(--text-secondary);
}

.history-body p {
  margin: 0;
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
