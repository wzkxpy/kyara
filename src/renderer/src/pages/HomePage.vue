<script setup lang="ts">
import { ref } from 'vue'
import ConfirmDialog from '@renderer/components/ConfirmDialog.vue'

// 主界面事件：开始游戏、加载存档、鉴赏模式、设置选项
const emit = defineEmits<{
  start: []
  load: []
  gallery: []
  settings: []
}>()

const isQuitConfirmOpen = ref(false)

const confirmQuit = (): void => {
  isQuitConfirmOpen.value = false
  window.api.app.quit()
}
</script>

<template>
  <main class="home">
    <!-- 后续可替换为真实背景图 -->
    <div class="background"></div>

    <div class="content">
      <h1 class="title">kyara</h1>

      <nav class="menu">
        <button type="button" @click="emit('start')">新游戏</button>
        <button type="button" @click="emit('load')">读取存档</button>
        <button type="button" @click="emit('gallery')">鉴赏模式</button>
        <button type="button" @click="emit('settings')">系统设置</button>
        <button type="button" @click="isQuitConfirmOpen = true">结束游戏</button>
      </nav>
    </div>

    <ConfirmDialog
      :open="isQuitConfirmOpen"
      message="确认要结束游戏吗？"
      danger
      @confirm="confirmQuit"
      @cancel="isQuitConfirmOpen = false"
    />
  </main>
</template>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* 临时占位背景，后续替换为真实图片 */
.background {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(84, 104, 255, 0.14), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(84, 104, 255, 0.08), transparent 45%), var(--surface);
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 2.5rem;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.menu {
  display: grid;
  gap: 0.9rem;
  min-width: 220px;
}

.menu button {
  appearance: none;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.menu button:hover {
  background: rgba(84, 104, 255, 0.12);
  border-color: var(--accent);
  transform: translateY(-1px);
}
</style>
