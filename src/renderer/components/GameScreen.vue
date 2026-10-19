<script lang="ts" setup>
import { ref, watch } from 'vue'
import { getResourceUrl } from '@shared/resources'
import type { GameState } from '@shared/types/state'

const props = defineProps<{
  scene: { type: 'bg' | 'cg'; name: string; diff: string } | null
  characters: GameState['characters']
}>()
const imageUrl = ref('')
const errorMessage = ref('')
const characterImages = ref<{ name: string; imageUrl: string; errorMessage: string }[]>([])

watch(
  () => props.characters.map(({ name, diff }) => ({ name, diff })),
  (characters, _, onCleanup) => {
    let cancelled = false
    const images: HTMLImageElement[] = []
    onCleanup(() => {
      cancelled = true
      images.forEach((image) => image.removeAttribute('src'))
    })

    const previous = new Map(characterImages.value.map((item) => [item.name, item.imageUrl]))
    characterImages.value = characters.map(({ name }) => ({
      name,
      imageUrl: previous.get(name) ?? '',
      errorMessage: ''
    }))

    characters.forEach(({ name, diff }, index) => {
      const image = new Image()
      images.push(image)
      const item = characterImages.value[index]
      const id = `${name}_${diff}`
      void (async () => {
        try {
          image.src = getResourceUrl('characters', id)
          // 每张立绘独立解码，差分切换期间保留旧图。
          await image.decode()
          if (!cancelled) item.imageUrl = image.src
        } catch (error) {
          if (cancelled) return
          item.imageUrl = ''
          item.errorMessage = `立绘资源加载失败：${id}`
          console.error(item.errorMessage, error)
        }
      })()
    })
  },
  { immediate: true }
)

watch(
  () => [props.scene?.type, props.scene?.name, props.scene?.diff],
  async (_, __, onCleanup) => {
    let cancelled = false
    const image = new Image()
    onCleanup(() => {
      cancelled = true
      image.removeAttribute('src')
    })
    errorMessage.value = ''
    const scene = props.scene
    if (!scene) {
      imageUrl.value = ''
      return
    }
    const id = `${scene.name}_${scene.diff}`
    try {
      image.src = getResourceUrl(scene.type === 'bg' ? 'backgrounds' : 'cgs', id)
      // 解码后再替换画面，过期任务不能覆盖当前场景。
      await image.decode()
      if (!cancelled) imageUrl.value = image.src
    } catch (error) {
      if (cancelled) return
      imageUrl.value = ''
      errorMessage.value = `画面资源加载失败：${id}`
      console.error(errorMessage.value, error)
    }
  },
  { immediate: true }
)
</script>

<template>
  <section class="game-screen" aria-label="游戏画面">
    <img v-if="imageUrl" class="scene-image" :src="imageUrl" alt="" draggable="false" />
    <div class="characters-layer">
      <div v-for="character in characterImages" :key="character.name" class="character-sprite">
        <img
          v-if="character.imageUrl"
          :src="character.imageUrl"
          :alt="character.name"
          draggable="false"
        />
        <p v-if="character.errorMessage" class="scene-error" role="status">
          {{ character.errorMessage }}
        </p>
      </div>
    </div>
    <p v-if="errorMessage" class="scene-error" role="status">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.game-screen {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #111;
}
.scene-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}
.scene-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  margin: 0;
  color: #fff;
}

.characters-layer {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}

.character-sprite {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.character-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  user-select: none;
}
</style>
