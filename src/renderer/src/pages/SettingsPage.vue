<script setup lang="ts">
import type { AppSettings } from '@shared/types/settings'
import { ref } from 'vue'
import ConfirmDialog from '@renderer/components/ConfirmDialog.vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@renderer/stores/settings'

type NumberSettingKey =
  | 'textSpeed'
  | 'autoSpeed'
  | 'dialogOpacity'
  | 'masterVolume'
  | 'musicVolume'
  | 'voiceVolume'
  | 'sfxVolume'

type BooleanSettingKey = 'interruptSpeech' | 'showAvatar'

// 设置界面
const props = withDefaults(
  defineProps<{
    fromHome?: boolean
  }>(),
  {
    fromHome: false
  }
)

const emit = defineEmits<{ game: []; home: [] }>()
const settingsStore = useSettingsStore()
const { settings, isLoading, errorMessage } = storeToRefs(settingsStore)
const { updateSetting, resetSettings } = settingsStore
const isResetConfirmOpen = ref(false)
const isHomeConfirmOpen = ref(false)

const updateSelectSetting = <K extends 'displayMode' | 'skipMode'>(
  key: K,
  event: Event
): Promise<void> => {
  const value = (event.target as HTMLSelectElement).value as AppSettings[K]
  return updateSetting(key, value)
}

const updateNumberSetting = (key: NumberSettingKey, event: Event): Promise<void> => {
  return updateSetting(key, Number((event.target as HTMLInputElement).value))
}

const updateBooleanSetting = (key: BooleanSettingKey, event: Event): Promise<void> => {
  return updateSetting(key, (event.target as HTMLInputElement).checked)
}

const formatSpeed = (value: number): string => value.toFixed(1)
const formatPercent = (value: number): string => `${Math.round(value * 100)}%`

const confirmResetSettings = async (): Promise<void> => {
  await resetSettings()
  isResetConfirmOpen.value = false
}

// 从游戏进入设置时，返回标题画面需要二次确认
const requestReturnHome = (): void => {
  if (props.fromHome) {
    emit('home')
    return
  }

  isHomeConfirmOpen.value = true
}

const confirmReturnHome = (): void => {
  isHomeConfirmOpen.value = false
  emit('home')
}

// 右键返回来源页面：从主页进入返回主页，从游戏进入返回游戏
const handleContextMenu = (event: MouseEvent): void => {
  event.preventDefault()
  if (props.fromHome) {
    emit('home')
    return
  }

  emit('game')
}
</script>

<template>
  <main class="page" @contextmenu="handleContextMenu">
    <header class="header">
      <h1>设置选项</h1>
    </header>

    <section class="content">
      <section class="setting-group">
        <h2>显示</h2>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>显示模式</h3>
          </div>
          <select
            :value="settings.displayMode"
            :disabled="isLoading"
            @change="updateSelectSetting('displayMode', $event)"
          >
            <option value="windowed">窗口</option>
            <option value="fullscreen">全屏</option>
          </select>
        </div>
      </section>

      <section class="setting-group">
        <h2>对话</h2>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>跳过未读文本</h3>
          </div>
          <select
            :value="settings.skipMode"
            :disabled="isLoading"
            @change="updateSelectSetting('skipMode', $event)"
          >
            <option value="readOnly">仅已读</option>
            <option value="all">全部</option>
          </select>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>文字显示速度</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              :value="settings.textSpeed"
              :disabled="isLoading"
              @input="updateNumberSetting('textSpeed', $event)"
            />
            <span class="range-value">{{ formatSpeed(settings.textSpeed) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>自动模式速度</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              :value="settings.autoSpeed"
              :disabled="isLoading"
              @input="updateNumberSetting('autoSpeed', $event)"
            />
            <span class="range-value">{{ formatSpeed(settings.autoSpeed) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>对话框透明度</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="settings.dialogOpacity"
              :disabled="isLoading"
              @input="updateNumberSetting('dialogOpacity', $event)"
            />
            <span class="range-value">{{ formatPercent(settings.dialogOpacity) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>翻页时中断语音</h3>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              :checked="settings.interruptSpeech"
              :disabled="isLoading"
              @change="updateBooleanSetting('interruptSpeech', $event)"
            />
            <span>{{ settings.interruptSpeech ? '已开启' : '已关闭' }}</span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>对话框显示头像</h3>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              :checked="settings.showAvatar"
              :disabled="isLoading"
              @change="updateBooleanSetting('showAvatar', $event)"
            />
            <span>{{ settings.showAvatar ? '已开启' : '已关闭' }}</span>
          </label>
        </div>
      </section>

      <section class="setting-group">
        <h2>音频</h2>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>主音量</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="settings.masterVolume"
              :disabled="isLoading"
              @input="updateNumberSetting('masterVolume', $event)"
            />
            <span class="range-value">{{ formatPercent(settings.masterVolume) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>音乐音量</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="settings.musicVolume"
              :disabled="isLoading"
              @input="updateNumberSetting('musicVolume', $event)"
            />
            <span class="range-value">{{ formatPercent(settings.musicVolume) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>语音音量</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="settings.voiceVolume"
              :disabled="isLoading"
              @input="updateNumberSetting('voiceVolume', $event)"
            />
            <span class="range-value">{{ formatPercent(settings.voiceVolume) }}</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-copy">
            <h3>系统音效音量</h3>
          </div>
          <div class="range-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="settings.sfxVolume"
              :disabled="isLoading"
              @input="updateNumberSetting('sfxVolume', $event)"
            />
            <span class="range-value">{{ formatPercent(settings.sfxVolume) }}</span>
          </div>
        </div>
      </section>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>

    <footer class="footer">
      <button type="button" :disabled="isLoading" @click="isResetConfirmOpen = true">
        恢复默认设置
      </button>
      <button v-if="!fromHome" type="button" @click="emit('game')">回到游戏</button>
      <button type="button" @click="requestReturnHome">返回标题画面</button>
    </footer>

    <ConfirmDialog
      :open="isResetConfirmOpen"
      message="确认要恢复默认设置吗？"
      danger
      @confirm="confirmResetSettings"
      @cancel="isResetConfirmOpen = false"
    />

    <ConfirmDialog
      :open="isHomeConfirmOpen"
      message="确认要返回标题画面吗？"
      @confirm="confirmReturnHome"
      @cancel="isHomeConfirmOpen = false"
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

.header button {
  appearance: none;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(84, 104, 255, 0.18);
  background: rgba(246, 247, 251, 0.94);
  backdrop-filter: blur(12px);
}

.footer button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.footer button {
  appearance: none;
  border: 1px solid rgba(84, 104, 255, 0.34);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;
}

.footer button:hover {
  border-color: var(--accent);
  background: rgba(84, 104, 255, 0.12);
  transform: translateY(-1px);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-group h2 {
  margin: 0;
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 700;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border: 1px solid rgba(84, 104, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
  padding: 1.1rem 1.2rem;
}

.setting-copy h3 {
  margin: 0;
  font-size: 1.05rem;
}

select {
  appearance: none;
  min-width: 140px;
  border: 1px solid rgba(84, 104, 255, 0.28);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-primary);
  padding: 0.45rem 0.75rem;
  cursor: pointer;
}

select:disabled,
input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.range-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 220px;
}

.range-control input {
  width: 160px;
  accent-color: var(--accent);
}

.range-value {
  min-width: 3rem;
  text-align: right;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;
  color: var(--text-primary);
  cursor: pointer;
}

.switch input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
}

.error {
  margin: 0;
  color: #c0392b;
}
</style>
