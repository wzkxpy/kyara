import type { Command } from '../src/shared/types/command'

export class ScriptSyntaxError extends Error {
  constructor(
    message: string,
    public readonly line: number
  ) {
    super(`Line ${line}: ${message}`)
    this.name = 'ScriptSyntaxError'
  }
}

export function parse(source: string): Command[] {
  let pendingVoice: string | null = null // 待处理的 @voice 指令
  const commands: Command[] = []
  const lines = source.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/)

  // 开始逐行解析脚本
  lines.forEach((raw, index) => {
    const lineNumber = index + 1 // 行号从 1 开始
    const line = raw.trim() // 去掉首尾空白字符
    if (!line) return // 空行
    if (line.startsWith('//')) return // 整行注释

    // 存在未使用的 voice 时当前行必须是对话行
    if (pendingVoice !== null && !line.startsWith('#')) {
      throw new ScriptSyntaxError('@voice must be followed by a dialogue', lineNumber)
    }

    // 对话行以 # 开头，格式为 #角色名 对话内容
    if (line.startsWith('#')) {
      const match = /^#([^\s\u3000]+)[\s\u3000]+(.+)$/u.exec(line)
      if (!match) throw new ScriptSyntaxError('Expected #角色名 对话内容', lineNumber)
      commands.push({
        type: 'dialogue',
        speaker: match[1],
        text: match[2],
        ...(pendingVoice !== null && { voice: pendingVoice })
      })
      pendingVoice = null
      return
    }

    // 指令行以 @ 开头，格式为 @指令 参数
    if (line.startsWith('@')) {
      const content = line.replace(/\s+\/\/.*$/u, '').trim() // 去掉行尾注释
      const parts = content.slice(1).trim().split(/\s+/u) // 去掉 @ 并按空白字符分割
      const [directive, ...args] = parts // directive 是指令名，args 是参数列表

      // 检查参数数量是否符合预期
      function expectArgs(count: number): void {
        if (args.length !== count) {
          throw new ScriptSyntaxError(
            `@${directive} expects ${count} argument(s), got ${args.length}`,
            lineNumber
          )
        }
      }

      switch (directive) {
        case 'bg':
          expectArgs(1)
          commands.push({ type: 'bg', name: args[0] })
          break
        case 'cg':
          expectArgs(1)
          commands.push({ type: 'cg', name: args[0] })
          break
        case 'voice':
          expectArgs(1)
          pendingVoice = args[0]
          break
        case 'bgm':
          expectArgs(1)
          commands.push({ type: 'bgm', name: args[0] })
          break
        case 'sfx':
          expectArgs(1)
          commands.push({ type: 'sfx', name: args[0] })
          break
        case 'show':
          expectArgs(2)
          commands.push({ type: 'show', character: args[0], expression: args[1] })
          break
        case 'load':
          expectArgs(1)
          commands.push({ type: 'load', scriptId: args[0] })
          break
        default:
          throw new ScriptSyntaxError(`Unknown directive @${directive}`, lineNumber)
      }
      return
    }

    if (line.startsWith('\\#') || line.startsWith('\\@')) {
      commands.push({ type: 'narration', text: line.slice(1) })
      return
    }
    commands.push({ type: 'narration', text: line })
  })

  // 检查是否有未使用的 @voice 指令
  if (pendingVoice !== null) {
    throw new ScriptSyntaxError('@voice has no following dialogue', lines.length)
  }

  return commands
}
