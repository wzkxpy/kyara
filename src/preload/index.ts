import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../shared/types/settings'

// 渲染进程可用的自定义 API
const api = {
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    set: (settings: AppSettings): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:set', settings)
  },
  app: {
    quit: (): void => ipcRenderer.send('app:quit')
  }
}

// 在上下文隔离开启时，只暴露安全 API 给渲染进程
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // 上下文隔离关闭时直接挂载到 window
  window.electron = electronAPI
  window.api = api
}
