<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { resolveUiAsset, type UiSlot } from '@renderer/lib/uiAssets'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@renderer/stores/settings'

type GameActionKey =
  | 'pinBar'
  | 'quickSave'
  | 'quickLoad'
  | 'save'
  | 'load'
  | 'history'
  | 'auto'
  | 'skip'
  | 'voiceReplay'
  | 'settings'
  | 'close'

interface GameAction {
  key: GameActionKey
  label: string
  slot: UiSlot
  icon: string
}

interface Props {
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  interactive: true
})

const emit = defineEmits<{
  action: [key: GameActionKey]
}>()

// 操作按钮图标按槽位 ID 解析，新增按钮只需登记 manifest 与槽位
const actions: GameAction[] = (
  [
    ['pinBar', '固定/解除', 'action.pin-bar'],
    ['quickSave', '快速存档', 'action.quick-save'],
    ['quickLoad', '快速读档', 'action.quick-load'],
    ['save', '存档', 'action.save'],
    ['load', '读档', 'action.load'],
    ['history', '历史记录', 'action.history'],
    ['auto', '自动播放', 'action.auto'],
    ['skip', '快进', 'action.skip'],
    ['voiceReplay', '语音重播', 'action.voice-replay'],
    ['settings', '设置', 'action.settings'],
    ['close', '关闭', 'action.close']
  ] as [GameActionKey, string, UiSlot][]
).map(([key, label, slot]) => ({ key, label, slot, icon: resolveUiAsset(slot) }))

// 操作栏自身管理固定、自动显隐和悬停提示
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const isActionBarRevealed = ref(settings.value.actionBarPinned)
const isActionBarPinned = ref(settings.value.actionBarPinned)
const isPointerInRevealZone = ref(false)
const hoveredActionLabel = ref<string | null>(null)
const actionBarRevealZone = 128

const clearActionHint = (): void => {
  hoveredActionLabel.value = null
}

const hideActionBarIfUnpinned = (): void => {
  if (!isActionBarPinned.value) {
    isActionBarRevealed.value = false
    clearActionHint()
  }
}

const handleWindowMouseMove = (event: MouseEvent): void => {
  if (!props.interactive) {
    return
  }

  isPointerInRevealZone.value = window.innerHeight - event.clientY <= actionBarRevealZone
  if (isPointerInRevealZone.value) {
    isActionBarRevealed.value = true
    return
  }

  hideActionBarIfUnpinned()
}

const handleWindowMouseOut = (event: MouseEvent): void => {
  if (event.relatedTarget) {
    return
  }

  isPointerInRevealZone.value = false
  hideActionBarIfUnpinned()
}

const toggleActionBarPinned = (): void => {
  const nextPinned = !isActionBarPinned.value
  isActionBarPinned.value = nextPinned
  isActionBarRevealed.value = nextPinned || isPointerInRevealZone.value
  if (!nextPinned && !isPointerInRevealZone.value) {
    clearActionHint()
  }
  void settingsStore.updateSetting('actionBarPinned', nextPinned)
}

const handleAction = (action: GameAction): void => {
  if (action.key === 'pinBar') {
    toggleActionBarPinned()
    return
  }

  emit('action', action.key)
}

const showActionHint = (label: string): void => {
  hoveredActionLabel.value = label
}

onMounted(() => {
  window.addEventListener('mousemove', handleWindowMouseMove)
  window.addEventListener('mouseout', handleWindowMouseOut)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleWindowMouseMove)
  window.removeEventListener('mouseout', handleWindowMouseOut)
})

watch(
  () => props.interactive,
  (interactive) => {
    if (!interactive) {
      isPointerInRevealZone.value = false
      isActionBarRevealed.value = false
      clearActionHint()
      return
    }

    isActionBarRevealed.value = isActionBarPinned.value || isPointerInRevealZone.value
  }
)

watch(
  () => settings.value.actionBarPinned,
  (pinned) => {
    isActionBarPinned.value = pinned
    isActionBarRevealed.value = pinned || isPointerInRevealZone.value
  }
)
</script>

<template>
  <div class="game-action-root">
    <div
      class="game-action-shell"
      :class="{ 'is-revealed': isActionBarPinned || isActionBarRevealed }"
    >
      <div class="game-action-bar" aria-label="游戏操作">
        <button
          v-for="action in actions"
          :key="action.key"
          class="game-action"
          :class="{
            'pin-action': action.key === 'pinBar',
            'is-active': action.key === 'pinBar' && isActionBarPinned
          }"
          type="button"
          :aria-label="action.label"
          :aria-pressed="action.key === 'pinBar' ? isActionBarPinned : undefined"
          @mouseenter="showActionHint(action.label)"
          @mouseleave="clearActionHint"
          @click="handleAction(action)"
        >
          <img :src="action.icon" alt="" draggable="false" />
        </button>
      </div>
    </div>

    <div v-if="props.interactive" class="game-action-hint" aria-live="polite">
      <span v-if="hoveredActionLabel" class="game-action-hint-text">
        {{ hoveredActionLabel }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.game-action-root {
  align-self: flex-end;
  max-width: 100%;
}

.game-action-shell {
  max-width: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(100% + max(1rem, env(safe-area-inset-bottom))));
  transition:
    transform 0.28s ease,
    opacity 0.2s ease;
  will-change: transform;
}

.game-action-shell.is-revealed {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.game-action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.game-action {
  appearance: none;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 13px;
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    filter 0.16s ease;
}

.game-action:hover {
  transform: translateY(-2px);
  filter: brightness(1.04) saturate(1.08);
}

.game-action:active {
  transform: translateY(0);
}

.game-action:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.game-action.is-active {
  box-shadow: 0 0 0 2px rgba(84, 104, 255, 0.34);
}

.game-action img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.game-action-hint {
  /* Keep viewport positioning outside the transformed action shell. */
  position: fixed;
  left: max(1rem, env(safe-area-inset-left));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 3;
  display: flex;
  align-items: center;
  min-height: 2rem;
  pointer-events: none;
}

.game-action-hint-text {
  border: 1px solid rgba(84, 104, 255, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  padding: 0.2rem 0.85rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 8px 22px rgba(31, 36, 48, 0.12);
}
</style>
