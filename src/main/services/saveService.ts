// src/main/services/saveService.ts
import { app, protocol } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { SaveData, SaveMetadata } from '../../shared/types/savedata'

const MAX_SLOTS = 30

// 获取本地存档目录
function getSaveDirectory(): string {
  return path.join(app.getPath('userData'), 'savedata')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// 检查存档元数据和完整游戏状态，包括嵌套场景及角色。
function isSaveData(value: unknown): value is SaveData {
  if (!isRecord(value)) return false
  const { metadata, state } = value
  if (!isRecord(metadata) || !isRecord(state)) return false
  return (
    typeof metadata.slotId === 'number' &&
    Number.isFinite(metadata.slotId) &&
    typeof metadata.timestamp === 'number' &&
    Number.isFinite(metadata.timestamp) &&
    typeof metadata.previewText === 'string' &&
    typeof metadata.screenshot === 'string' &&
    typeof state.scriptId === 'string' &&
    typeof state.pc === 'number' &&
    Number.isInteger(state.pc) &&
    state.pc >= 0 &&
    (state.scene === null ||
      (isRecord(state.scene) &&
        (state.scene.type === 'bg' || state.scene.type === 'cg') &&
        typeof state.scene.name === 'string')) &&
    (state.bgm === null || typeof state.bgm === 'string') &&
    Array.isArray(state.characters) &&
    state.characters.every(
      (character: unknown) =>
        isRecord(character) &&
        typeof character.name === 'string' &&
        typeof character.expression === 'string'
    ) &&
    (state.speaker === null || typeof state.speaker === 'string') &&
    typeof state.text === 'string' &&
    typeof state.finished === 'boolean'
  )
}

// 读取存档
export async function readSave(slotId: number): Promise<SaveData | null> {
  const filePath = path.join(getSaveDirectory(), `save${slotId}.dat`)
  let content: string
  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
  const data: unknown = JSON.parse(content)
  if (!isSaveData(data)) {
    throw new Error(`Invalid save data in slot ${slotId}`)
  }
  return data
}

// 获取全部存档元数据列表
export async function listSaves(): Promise<SaveMetadata[]> {
  const result: SaveMetadata[] = []
  for (let slotId = 1; slotId <= MAX_SLOTS; slotId++) {
    try {
      const save = await readSave(slotId)
      if (save) {
        result.push(save.metadata)
      }
    } catch (error) {
      console.error(`Failed to read slot ${slotId}:`, error)
    }
  }
  return result
}

// 写入存档
export async function writeSave(data: SaveData, screenshot: Buffer): Promise<void> {
  const slotId = data.metadata.slotId
  const directory = getSaveDirectory()
  const dataPath = path.join(directory, `save${slotId}.dat`)
  const dataTempPath = `${dataPath}.tmp`
  const imagePath = path.join(directory, `save${slotId}.jpg`)
  const imageTempPath = `${imagePath}.tmp`
  await fs.mkdir(directory, { recursive: true })
  // 覆盖存档时保留原图用于恢复
  const previousImage = await fs.readFile(imagePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  let imageReplaced = false // 标记是否已成功替换截图
  try {
    await fs.writeFile(dataTempPath, JSON.stringify(data, null, 2), 'utf-8')
    await fs.writeFile(imageTempPath, screenshot)
    await fs.rename(imageTempPath, imagePath)
    imageReplaced = true
    await fs.rename(dataTempPath, dataPath)
  } catch (error) {
    // 数据写入失败时恢复原图，避免旧存档与新截图混用。
    if (imageReplaced) {
      if (previousImage) {
        await fs.writeFile(imagePath, previousImage)
      } else {
        await fs.rm(imagePath, { force: true })
      }
    }
    throw error
  } finally {
    await fs.rm(dataTempPath, { force: true }).catch(() => {})
    await fs.rm(imageTempPath, { force: true }).catch(() => {})
  }
}

// 从 URL 映射到本地存档截图文件名
// URL: screen-shot://image/save${slotId}.jpg?v=${timestamp}
function getScreenshotName(url: string): string | null {
  const match = /^screen-shot:\/\/image\/save([0-9]|[12][0-9]|30)\.jpg(?:\?v=\d+)?$/.exec(url)
  return match ? `save${match[1]}.jpg` : null
}

// 注册自定义协议以提供存档截图
export function registerImageProtocol(): void {
  protocol.handle('screen-shot', async (request) => {
    const name = getScreenshotName(request.url)
    if (!name) return new Response(null, { status: 404 })
    try {
      const bytes = await fs.readFile(path.join(getSaveDirectory(), name))
      return new Response(new Uint8Array(bytes), {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' }
      })
    } catch {
      return new Response(null, { status: 404 })
    }
  })
}
