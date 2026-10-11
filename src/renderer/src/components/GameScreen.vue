<template>
  <section class="game-screen" aria-label="游戏画面">
    <div class="screen-placeholder">
      <p>当前背景：{{ scene?.name || '无' }}</p>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  scene: { type: 'bg' | 'cg'; name: string } | null
}>()
</script>

<style scoped>
.game-screen {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(84, 104, 255, 0.14), transparent 36%),
    linear-gradient(180deg, #e9edf8 0%, #f7f8fc 62%, #eef1f8 100%);
}

.screen-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-content: center;
  color: var(--text-secondary);
  text-align: center;
}
</style>
