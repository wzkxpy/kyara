// 构建期校验 UI 资源 manifest：槽位引用的文件必须存在，assets 中未被引用的图给出告警
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '../src/renderer/src/assets')
const manifest = JSON.parse(readFileSync(join(assetsDir, 'manifest.json'), 'utf8'))

const manifestEntries = Object.entries(manifest)
let failed = false

// 1. manifest 中每个槽位指向的文件必须存在
for (const [slot, file] of manifestEntries) {
  if (!existsSync(join(assetsDir, file))) {
    console.error(`[manifest] 文件不存在: ${slot} -> ${file}`)
    failed = true
  }
}

// 2. 反向检查：assets 内的 UI 图文件应被 manifest 引用
const exts = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
const uiImageFiles = readdirSync(assetsDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .filter((entry) => exts.includes(`.${entry.name.split('.').pop()}`))
  .map((entry) => join(entry.parentPath ?? assetsDir, entry.name))

const referenced = new Set(manifestEntries.map(([, file]) => join(assetsDir, file)))
for (const file of uiImageFiles) {
  if (!referenced.has(file)) {
    console.warn(`[manifest] 未被引用的 UI 资源: ${relative(assetsDir, file)}`)
  }
}

if (failed) {
  process.exit(1)
}
console.log(
  `[manifest] 校验通过: ${manifestEntries.length} 个槽位, ${uiImageFiles.length} 个资源文件`
)
