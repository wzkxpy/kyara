import uiManifest from '@renderer/assets/manifest.json'

// UI 资源槽位 ID，新增 UI 图时先在此登记
export type UiSlot = {
  [K in keyof typeof uiManifest]: K
}[keyof typeof uiManifest]

// 构建期把所有 UI 文件编译为 URL 映射，运行时按槽位 ID 取用
const assetUrls = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

// 槽位 ID 与 manifest 路径的相对前缀统一处理
const manifestPath = (rel: string): string => '../assets/' + rel.replace(/^\.?\//, '')

// 按槽位 ID 解析 UI 资源 URL，缺失时告警并返回空串，由调用方决定降级展示
export function resolveUiAsset(slot: UiSlot): string {
  const rel = manifestPath(uiManifest[slot] as string)
  const url = assetUrls[rel] ?? ''
  if (!url) {
    console.warn(`[ui] 资源缺失: ${slot} -> ${uiManifest[slot]}`)
  }
  return url
}
