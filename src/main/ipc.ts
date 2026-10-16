// src/main/ipc.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import { getSettings, setSettings } from './settings'
import { listSaves, readSave, writeSave } from './services/saveService'

import type { SaveData } from '../shared/types/savedata'
import type { Settings } from '../shared/types/settings'

// 应用全屏设置
function applyDisplayMode(settings: Settings): void {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  targetWindow?.setFullScreen(settings.displayMode === 'fullscreen')
}

// 注册主进程 IPC 接口
export function registerIpcHandlers(): void {
  // IPC 测试接口
  ipcMain.on('ping', () => console.log('pong'))

  // 全局设置读写接口
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:set', (_event, settings: Settings) => {
    const nextSettings = setSettings(settings)
    applyDisplayMode(nextSettings)
    return nextSettings
  })

  // 存档接口
  let screenshot: Buffer // 暂存最新截图，选择槽位后写入
  ipcMain.handle('saves:capture', async (event) => {
    const image = await event.sender.capturePage() // 截取页面当前画面
    screenshot = image.resize({ width: 480 }).toJPEG(80)
  })
  ipcMain.handle('saves:list', () => listSaves())
  ipcMain.handle('saves:read', (_event, slotId: number) => readSave(slotId))
  ipcMain.handle('saves:write', async (_event, data: SaveData) => {
    await writeSave(data, screenshot)
    return data.metadata
  })

  // 应用退出接口
  ipcMain.on('app:quit', () => app.quit())
}
