import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getSettings, setSettings } from './settings'
import type { Settings } from '../shared/types/settings'
import icon from '../../resources/icon.png?asset'

// 应用全屏设置
function applyDisplayMode(settings: Settings): void {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  targetWindow?.setFullScreen(settings.displayMode === 'fullscreen')
}

// 创建主窗口
function createWindow(): void {
  const initialSettings = getSettings()
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: false, // 固定窗口尺寸
    maximizable: false, // 禁用最大化
    fullscreenable: true, // 允许切换全屏
    show: false, // 暂不显示窗口，等内容加载完成后再显示
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 按上次保存的显示模式恢复窗口状态
  if (initialSettings.displayMode === 'fullscreen') {
    mainWindow.setFullScreen(true)
  }

  // 窗口就绪后再显示，避免闪烁
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 阻止应用内新窗口，改用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载远程地址，生产环境加载本地文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 应用初始化完成后再创建窗口
app.whenReady().then(() => {
  // 设置 Windows 应用用户模型 ID
  electronApp.setAppUserModelId('com.electron')

  // 统一处理窗口快捷键
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC 测试接口
  ipcMain.on('ping', () => console.log('pong'))

  // 全局设置读写接口
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:set', (_event, settings: Settings) => {
    const nextSettings = setSettings(settings)
    applyDisplayMode(nextSettings)
    return nextSettings
  })

  // 应用退出接口
  ipcMain.on('app:quit', () => app.quit())

  createWindow()

  // macOS 下点击 Dock 图标时重建窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 非 macOS 平台，所有窗口关闭后退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
