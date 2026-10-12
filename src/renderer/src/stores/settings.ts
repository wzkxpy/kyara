import { ref } from 'vue'
import { defineStore } from 'pinia'
import { defaultAppSettings, type Settings } from '@shared/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...defaultAppSettings })
  const isLoading = ref(false)
  const errorMessage = ref('')

  // 从配置文件加载设置
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

  // 将完整设置整体写回主进程（非增量更新），并采用返回值覆盖本地状态
  async function saveSettings(nextSettings: Settings): Promise<void> {
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

  // 更新单个设置项：展开当前设置、替换目标键后整体写回
  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    return saveSettings({
      ...settings.value,
      [key]: value
    })
  }

  // 恢复默认设置
  function resetSettings(): Promise<void> {
    return saveSettings({ ...defaultAppSettings })
  }

  return {
    settings,
    isLoading,
    errorMessage,
    loadSettings,
    updateSetting,
    resetSettings
  }
})
