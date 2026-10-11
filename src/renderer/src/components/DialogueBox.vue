<template>
  <section class="dialogue-box" aria-live="polite">
    <img class="dialogue-body" :src="dialogueBoxImage" alt="" draggable="false" />

    <div v-if="showAvatar && avatar" class="dialogue-avatar">
      <img :src="avatar" alt="" draggable="false" />
    </div>

    <div class="dialogue-content">
      <div class="dialogue-name">{{ speakerName }}</div>
      <p class="dialogue-text">{{ text }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { resolveUiAsset } from '@renderer/lib/uiAssets'

// 对话框框体通过 UI 资源槽位解析
const dialogueBoxImage = resolveUiAsset('dialog.box')

withDefaults(
  defineProps<{
    speakerName: string | null
    avatar?: string
    text: string
    showAvatar?: boolean
  }>(),
  {
    avatar: '',
    showAvatar: true
  }
)
</script>

<style scoped>
.dialogue-box {
  position: relative;
  width: min(100%, 960px);
  height: clamp(150px, 24vh, 220px);
}

.dialogue-body {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  border-radius: 14px;
  pointer-events: none;
}

.dialogue-avatar {
  position: absolute;
  top: 50%;
  left: -110px;
  transform: translateY(-50%);
  z-index: 2;
  width: 92px;
  height: 92px;
  border: 2px solid rgba(84, 104, 255, 0.48);
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 24px rgba(31, 36, 48, 0.12);
}

.dialogue-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialogue-content {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.1rem 1.4rem 1rem;
}

.dialogue-name {
  align-self: flex-start;
  border: 1px solid rgba(84, 104, 255, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  padding: 0.2rem 0.7rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dialogue-text {
  overflow: auto;
  color: var(--text-primary);
  font-size: 1.02rem;
  line-height: 1.7;
  white-space: pre-wrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.78);
}
</style>
