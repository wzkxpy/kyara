<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    message: string
    danger?: boolean
  }>(),
  {
    danger: false
  }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

// 弹窗打开时按 Esc 视为取消
const handleKeydown = (event: KeyboardEvent): void => {
  if (!props.open || event.key !== 'Escape') return
  event.stopImmediatePropagation() // 阻止事件冒泡，避免触发游戏界面的 Esc 事件
  emit('cancel')
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="open"
        class="confirm-overlay"
        role="presentation"
        @contextmenu.prevent="emit('cancel')"
      >
        <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="message">
          <h2 class="confirm-message">{{ message }}</h2>

          <footer class="confirm-footer">
            <button
              type="button"
              class="confirm-button"
              :class="{ danger }"
              @click="emit('confirm')"
            >
              是
            </button>
            <button type="button" class="cancel-button" @click="emit('cancel')">否</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.confirm-dialog {
  width: min(100%, 420px);
  border: 1px solid rgba(84, 104, 255, 0.22);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 24px 60px rgba(31, 36, 48, 0.2),
    0 2px 8px rgba(84, 104, 255, 0.12);
}

.confirm-message {
  margin: 0;
  padding: 1.35rem 1.35rem 0.85rem;
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.confirm-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  padding: 0.9rem 1.35rem 1.15rem;
  border-top: 1px solid rgba(84, 104, 255, 0.14);
  background: rgba(246, 247, 251, 0.72);
}

.confirm-footer button {
  appearance: none;
  border-radius: 999px;
  padding: 0.5rem 1.1rem;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid rgba(84, 104, 255, 0.28);
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-primary);
}

.confirm-button {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  box-shadow: 0 8px 18px rgba(84, 104, 255, 0.24);
}

.confirm-button.danger {
  border-color: #d95b5b;
  background: #d95b5b;
  box-shadow: 0 8px 18px rgba(217, 91, 91, 0.24);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.16s ease;
}

.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.16s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  transform: translateY(8px) scale(0.98);
}
</style>
