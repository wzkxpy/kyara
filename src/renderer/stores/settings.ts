// src/renderer/stores/settings.ts

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
      const loadedSettings = await window.api.settings.get()
      Object.assign(settings.value, loadedSettings)
    } catch {
      errorMessage.value = '读取设置失败'
    } finally {
      isLoading.value = false
    }
  }

  // 将完整设置整体写回主进程
  async function saveSettings(nextSettings: Settings): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const savedSettings = await window.api.settings.set(nextSettings)
      Object.assign(settings.value, savedSettings)
    } catch {
      errorMessage.value = '保存设置失败'
    } finally {
      isLoading.value = false
    }
  }

  // 仅更新本地状态，用于滑杆拖动时实时预览
  function previewSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    settings.value[key] = value
  }

  // 将当前完整设置写回主进程
  function persistSettings(): Promise<void> {
    return saveSettings({ ...settings.value })
  }

  // 更新并持久化单个设置项
  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    return saveSettings({
      ...settings.value,
      [key]: value
    })
  }

  // 恢复默认设置
  function resetSettings(): Promise<void> {
    Object.assign(settings.value, defaultAppSettings)
    return persistSettings()
  }

  return {
    settings,
    isLoading,
    errorMessage,
    loadSettings,
    previewSetting,
    persistSettings,
    updateSetting,
    resetSettings
  }
})
