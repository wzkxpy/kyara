import type { Command } from '@shared/types/command'
import scriptsManifest from '../../../resources/scripts/manifest.json'

// 新游戏入口脚本，取自脚本清单的 entry 字段
export const DEFAULT_SCRIPT = scriptsManifest.entry

// 按清单动态导入脚本文件（排除清单自身），文件名单以 manifest 为准
const scriptModules = import.meta.glob<{ commands: Command[] }>([
  '../../../resources/scripts/*.json',
  '!../../../resources/scripts/manifest.json'
])

// 预载后的命令表：scriptId -> commands
const registry: Record<string, Command[]> = {}

// 启动时预加载脚本，初始化完成后按 ID 同步查表。
export async function initScripts(): Promise<void> {
  await Promise.all(
    scriptsManifest.scripts.map(async ({ id, file }) => {
      const load = scriptModules[`../../../resources/scripts/${file}`]
      if (!load) {
        console.warn(`脚本文件缺失：${file}`)
        return
      }
      try {
        const mod = await load()
        registry[id] = mod.commands
      } catch (error) {
        console.error(`脚本加载失败：${file}`, error)
      }
    })
  )
}

// 按脚本 ID 获取命令表（须先完成 initScripts）。
export function getCommands(scriptId = DEFAULT_SCRIPT): Command[] {
  const commands = registry[scriptId]
  if (!commands) {
    const listed = scriptsManifest.scripts.some((s) => s.id === scriptId)
    throw new Error(listed ? `Script not loaded: ${scriptId}` : `Unknown script: ${scriptId}`)
  }
  return commands
}
