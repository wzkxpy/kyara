// src/shared/types/settings.ts

export interface Settings {
  displayMode: 'windowed' | 'fullscreen' // 窗口/全屏
  skipMode: 'readOnly' | 'all' // 快进 仅已读/全部
  textSpeed: number // 文本显示速度
  autoSpeed: number // 自动模式速度
  dialogOpacity: number // 对话框透明度

  interruptSpeech: boolean // 翻页时中断语音
  showAvatar: boolean // 对话框显示角色头像
  actionBarPinned: boolean // 固定对话框操作栏

  masterVolume: number // 主音量
  musicVolume: number // 音乐音量
  voiceVolume: number // 语音音量
  sfxVolume: number // 系统音效音量
}

export const defaultAppSettings: Settings = {
  displayMode: 'windowed',
  skipMode: 'readOnly',
  textSpeed: 50,
  autoSpeed: 40,
  dialogOpacity: 0.8,
  interruptSpeech: false,
  showAvatar: true,
  actionBarPinned: true,
  masterVolume: 1,
  musicVolume: 1,
  voiceVolume: 1,
  sfxVolume: 1
}
