import ElectronStore from 'electron-store'
import { defaultAppSettings, type AppSettings } from '../shared/types/settings'

export type Settings = AppSettings

// electron-store 是 ESM 包，兼容打包成 CommonJS 后的默认导出
const Store =
  (ElectronStore as unknown as { default?: typeof ElectronStore }).default ?? ElectronStore

const store = new Store<Settings>({
  defaults: defaultAppSettings
})

export function getSettings(): Settings {
  return store.store
}

export function setSettings(settings: Settings): Settings {
  store.store = settings
  return getSettings()
}
