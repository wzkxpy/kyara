import { onMounted, ref } from 'vue'
import { defaultAppSettings, type AppSettings } from '@shared/types/settings'

// 全局共享的设置状态，避免不同页面各自维护一份数据
const settings = ref<AppSettings>({ ...defaultAppSettings })
const isLoading = ref(false)
const errorMessage = ref('')

export function useAppSettings(): {
  settings: typeof settings
  isLoading: typeof isLoading
  errorMessage: typeof errorMessage
  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  resetSettings: () => Promise<void>
} {
  async function loadSettings(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      settings.value = await window.api.settings.get()
    } catch {
      errorMessage.value = '读取设置失败'
    } finally {
      isLoading.value = false
    }
  }

  async function saveSettings(nextSettings: AppSettings): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      settings.value = await window.api.settings.set(nextSettings)
    } catch {
      errorMessage.value = '保存设置失败'
    } finally {
      isLoading.value = false
    }
  }

  function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    return saveSettings({
      ...settings.value,
      [key]: value
    })
  }

  function resetSettings(): Promise<void> {
    return saveSettings({ ...defaultAppSettings })
  }

  onMounted(() => {
    void loadSettings()
  })

  return {
    settings,
    isLoading,
    errorMessage,
    loadSettings,
    updateSetting,
    resetSettings
  }
}
