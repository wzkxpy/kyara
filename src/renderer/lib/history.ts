import type { Command } from '@shared/types/command'

export interface HistoryEntry {
  commandIndex: number // 脚本内命令索引，供后续历史跳转使用
  speaker: string | null
  text: string
}

// 从脚本命令中反向收集最近 limit 条文本记录
export function collectHistory(
  commands: readonly Command[],
  pc: number,
  limit: number
): HistoryEntry[] {
  const entries: HistoryEntry[] = []
  const end = Math.min(pc, commands.length)

  for (let index = end - 1; index >= 0 && entries.length < limit; index--) {
    const command = commands[index]
    if (command.type === 'narration') {
      entries.push({ commandIndex: index, speaker: null, text: command.text })
    } else if (command.type === 'dialogue') {
      entries.push({ commandIndex: index, speaker: command.speaker, text: command.text })
    }
  }

  return entries.reverse()
}
