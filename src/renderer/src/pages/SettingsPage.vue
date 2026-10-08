<script setup lang="ts">
// 设置界面
const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <main class="page">
    <header class="header">
      <button type="button" @click="emit('back')">返回主界面</button>
      <h1>设置选项</h1>
    </header>

    <section class="placeholder">
      <p>设置界面占位</p>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(124, 140, 255, 0.2);
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.header button {
  appearance: none;
  border: 1px solid rgba(124, 140, 255, 0.4);
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.placeholder {
  flex: 1;
  display: grid;
  place-content: center;
  color: var(--text-secondary);
}
</style>
