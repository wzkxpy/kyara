// src/main/services/saveService.ts
import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { SaveData, SaveMetadata } from '../../shared/types/savedata'

const MAX_SLOTS = 30

// 验证槽位编号是否合法
function validateSlotId(slotId: number): void {
  if (!Number.isInteger(slotId) || slotId < 1 || slotId > MAX_SLOTS) {
    throw new Error(`Invalid save slot: ${slotId}`)
  }
}

// 获取本地存档目录
function getSaveDirectory(): string {
  return path.join(app.getPath('userData'), 'savedata')
}

// 获取指定槽位的存档路径
function getSavePath(slotId: number): string {
  validateSlotId(slotId)
  return path.join(getSaveDirectory(), `save_${slotId}.dat`)
}

// 检查对象是否符合 SaveData 接口
function isSaveData(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<SaveData>
  return (
    typeof data.metadata?.slotId === 'number' &&
    typeof data.metadata?.timestamp === 'number' &&
    typeof data.metadata?.previewText === 'string' &&
    data.state !== null &&
    typeof data.state === 'object' &&
    Number.isInteger(data.state?.pc)
  )
}

// 读取指定槽位
export async function readSave(slotId: number): Promise<SaveData | null> {
  const filePath = getSavePath(slotId)
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
  if (data.metadata.slotId !== slotId) {
    throw new Error(`Save slot mismatch: ${slotId}`)
  }
  return data
}

// 列出所有存档元数据
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
export async function writeSave(data: SaveData): Promise<void> {
  const slotId = data.metadata.slotId
  validateSlotId(slotId)

  if (!isSaveData(data)) {
    throw new Error('Invalid save data')
  }

  const directory = getSaveDirectory()
  const filePath = getSavePath(slotId)
  const tempPath = `${filePath}.tmp`

  await fs.mkdir(directory, { recursive: true })

  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8')
    await fs.rename(tempPath, filePath)
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => {})
  }
}
