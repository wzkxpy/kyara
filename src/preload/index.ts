import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 渲染进程可用的自定义 API
const api = {}

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
