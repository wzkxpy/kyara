<script setup lang="ts">
import autoIcon from '@renderer/assets/ui/game-actions/auto.svg'
import closeIcon from '@renderer/assets/ui/game-actions/close.svg'
import historyIcon from '@renderer/assets/ui/game-actions/history.svg'
import loadIcon from '@renderer/assets/ui/game-actions/load.svg'
import quickLoadIcon from '@renderer/assets/ui/game-actions/quick-load.svg'
import quickSaveIcon from '@renderer/assets/ui/game-actions/quick-save.svg'
import saveIcon from '@renderer/assets/ui/game-actions/save.svg'
import settingsIcon from '@renderer/assets/ui/game-actions/settings.svg'
import skipIcon from '@renderer/assets/ui/game-actions/skip.svg'

type GameActionKey =
  'quickSave' | 'quickLoad' | 'save' | 'load' | 'history' | 'auto' | 'skip' | 'settings' | 'close'

interface GameAction {
  key: GameActionKey
  label: string
  icon: string
}

const emit = defineEmits<{ action: [key: GameActionKey] }>()

const actions: GameAction[] = [
  { key: 'quickSave', label: '快速存档', icon: quickSaveIcon },
  { key: 'quickLoad', label: '快速读档', icon: quickLoadIcon },
  { key: 'save', label: '存档', icon: saveIcon },
  { key: 'load', label: '读档', icon: loadIcon },
  { key: 'history', label: '历史记录', icon: historyIcon },
  { key: 'auto', label: '自动播放', icon: autoIcon },
  { key: 'skip', label: '快进', icon: skipIcon },
  { key: 'settings', label: '设置', icon: settingsIcon },
  { key: 'close', label: '关闭', icon: closeIcon }
]
</script>

<template>
  <div class="game-action-bar" aria-label="游戏操作">
    <button
      v-for="action in actions"
      :key="action.key"
      class="game-action"
      type="button"
      :aria-label="action.label"
      :title="action.label"
      @click="emit('action', action.key)"
    >
      <img :src="action.icon" alt="" draggable="false" />
    </button>
  </div>
</template>

<style scoped>
.game-action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.game-action {
  appearance: none;
  width: 88px;
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

.game-action img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
