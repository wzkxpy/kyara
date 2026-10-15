<!-- src/renderer/pages/SaveLoadPage.vue -->
<script setup lang="ts">
// 存档 / 读档界面，通过 useSaveLoad 组合式函数调用存档后端
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ConfirmDialog from '@renderer/components/ConfirmDialog.vue'
import { useSaveLoad } from '@renderer/composables/useSaveLoad'
import type { SaveMetadata } from '@shared/types/savedata'

interface SaveSlot {
  index: number // 全局槽位序号（1 起）
  metadata: SaveMetadata | null // 存档元数据，null 表示空槽位
}

// mode: save | load
const props = withDefaults(defineProps<{ mode?: 'save' | 'load' }>(), { mode: 'load' })
const emit = defineEmits<{ back: []; loaded: [] }>()

const { listSaves, loadGame, saveGame } = useSaveLoad()

const SLOTS_PER_PAGE = 12
const TOTAL_SLOTS = 30 // 与主进程 saveService 的 MAX_SLOTS 一致

const slots = ref<SaveSlot[]>(
  Array.from({ length: TOTAL_SLOTS }, (_, i) => ({ index: i + 1, metadata: null }))
)
const currentPage = ref(0)

// 读写进行中，防止重复点击
const isBusy = ref(false)

const pageCount = computed(() => Math.ceil(TOTAL_SLOTS / SLOTS_PER_PAGE))
const visibleSlots = computed(() =>
  slots.value.slice(currentPage.value * SLOTS_PER_PAGE, (currentPage.value + 1) * SLOTS_PER_PAGE)
)

const isSaveMode = computed(() => props.mode === 'save')
const title = computed(() => (isSaveMode.value ? '存档' : '读档'))

// 覆盖存档二次确认
const overwriteIndex = ref<number | null>(null)

// 底部状态提示，短暂显示后自动清除
const statusMessage = ref('')
let statusTimer: ReturnType<typeof setTimeout> | null = null

const showStatus = (message: string): void => {
  statusMessage.value = message
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => (statusMessage.value = ''), 2200)
}

onBeforeUnmount(() => {
  if (statusTimer) clearTimeout(statusTimer)
})

// 启动时拉取存档元数据列表
const loadSlotList = async (): Promise<void> => {
  try {
    const list = await listSaves()
    for (const metadata of list) {
      const slot = slots.value[metadata.slotId - 1]
      if (slot) slot.metadata = metadata
    }
  } catch (error) {
    console.error('读取存档列表失败:', error)
    showStatus('读取存档列表失败')
  }
}

onMounted(() => {
  void loadSlotList()
})

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const goToPage = (page: number): void => {
  if (page < 0 || page >= pageCount.value) return
  currentPage.value = page
}

// 写入槽位
const saveToSlot = async (slot: SaveSlot): Promise<void> => {
  isBusy.value = true
  try {
    slot.metadata = await saveGame(slot.index)
    showStatus(`已存档到槽位 ${slot.index}`)
  } catch (error) {
    console.error(`存档到槽位 ${slot.index} 失败:`, error)
    showStatus(`存档失败（槽位 ${slot.index}）`)
  } finally {
    isBusy.value = false
  }
}

// 读取槽位并直接恢复游戏会话，成功后通知上层切屏
const loadFromSlot = async (slot: SaveSlot): Promise<void> => {
  isBusy.value = true
  try {
    const restored = await loadGame(slot.index)
    if (!restored) {
      showStatus(`槽位 ${slot.index} 为空`)
      return
    }
    emit('loaded')
  } catch (error) {
    console.error(`读取槽位 ${slot.index} 失败:`, error)
    showStatus(`读档失败（槽位 ${slot.index}）`)
  } finally {
    isBusy.value = false
  }
}

const handleSlotClick = (slot: SaveSlot): void => {
  if (isBusy.value) return

  if (isSaveMode.value) {
    // 存档模式：空槽位直接写入，已占用则确认后覆盖
    if (slot.metadata) {
      overwriteIndex.value = slot.index
    } else {
      void saveToSlot(slot)
    }
    return
  }

  // 读档模式：仅已占用槽位可读取
  if (!slot.metadata) return
  void loadFromSlot(slot)
}

const confirmOverwrite = (): void => {
  const target = slots.value.find((s) => s.index === overwriteIndex.value)
  overwriteIndex.value = null
  if (target) void saveToSlot(target)
}

// 右键返回来源页面
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  emit('back')
}
</script>

<template>
  <main class="page" @contextmenu="handleContextMenu">
    <header class="header">
      <button type="button" class="back-button" @click="emit('back')">返回</button>
      <h1>{{ title }}</h1>
    </header>

    <section class="content">
      <div class="slot-grid">
        <button
          v-for="slot in visibleSlots"
          :key="slot.index"
          type="button"
          class="slot"
          :class="{ 'is-empty': !slot.metadata }"
          :disabled="!isSaveMode && !slot.metadata"
          @click="handleSlotClick(slot)"
        >
          <div class="slot-thumb">
            <img
              v-if="slot.metadata?.screenshot"
              :src="slot.metadata.screenshot"
              alt=""
              draggable="false"
            />
            <span v-else class="slot-thumb-empty">空槽位</span>
            <span class="slot-index">{{ slot.index }}</span>
          </div>

          <div class="slot-meta">
            <p class="slot-label">{{ slot.metadata?.previewText ?? '未使用' }}</p>
            <p class="slot-time">
              {{ slot.metadata ? formatTimestamp(slot.metadata.timestamp) : '尚无存档' }}
            </p>
          </div>
        </button>
      </div>
    </section>

    <footer class="footer">
      <p class="status" aria-live="polite">{{ statusMessage }}</p>

      <div class="pager">
        <button type="button" :disabled="currentPage === 0" @click="goToPage(currentPage - 1)">
          上一页
        </button>
        <span class="pager-indicator">{{ currentPage + 1 }} / {{ pageCount }}</span>
        <button
          type="button"
          :disabled="currentPage === pageCount - 1"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </footer>

    <ConfirmDialog
      :open="overwriteIndex !== null"
      :message="`覆盖槽位 ${overwriteIndex} 的存档？`"
      danger
      @confirm="confirmOverwrite"
      @cancel="overwriteIndex = null"
    />
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
  border-bottom: 1px solid rgba(84, 104, 255, 0.18);
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.back-button {
  appearance: none;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.back-button:hover {
  border-color: var(--accent);
  background: rgba(84, 104, 255, 0.12);
}

.content {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.slot {
  appearance: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(84, 104, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
  padding: 0;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.slot:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 10px 24px rgba(84, 104, 255, 0.16);
}

.slot:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.slot.is-empty {
  border-style: dashed;
  background: rgba(255, 255, 255, 0.4);
}

.slot-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  display: grid;
  place-content: center;
  overflow: hidden;
  background: linear-gradient(180deg, #e9edf8 0%, #f7f8fc 62%, #eef1f8 100%);
}

.slot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slot-thumb-empty {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.slot-index {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  min-width: 1.6rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: rgba(31, 36, 48, 0.6);
  color: #fff;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.slot-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem 0.85rem;
}

.slot-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.slot.is-empty .slot-label {
  color: var(--text-secondary);
  font-weight: 400;
}

.slot-time {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid rgba(84, 104, 255, 0.18);
  background: rgba(246, 247, 251, 0.94);
  backdrop-filter: blur(12px);
}

.status {
  margin: 0;
  min-height: 1.4rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.pager {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pager button {
  appearance: none;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-primary);
  padding: 0.4rem 0.95rem;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.pager button:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(84, 104, 255, 0.12);
}

.pager button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pager-indicator {
  min-width: 3rem;
  text-align: center;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
