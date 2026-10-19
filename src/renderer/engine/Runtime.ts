// src/renderer/engine/Runtime.ts
import type { Command } from '@shared/types/command'
import type { GameState } from '@shared/types/state'
import type { AudioManager } from './AudioManager'
import type { Settings } from '@shared/types/settings'
import { initState } from './GameState'
import { getCommands } from './ScriptRepository'

export class Runtime {
  constructor(
    private commands: Command[],
    private state: GameState,
    private audio: AudioManager,
    private settings: Settings
  ) {}

  advance(): void {
    if (this.state.finished) return

    // 根据设置决定翻页时是否打断语音
    if (this.settings.interruptSpeech) {
      this.audio.stopVoice()
    }

    while (this.state.pc < this.commands.length) {
      const command = this.commands[this.state.pc++]

      switch (command.type) {
        case 'bg':
          this.state.scene = { type: 'bg', name: command.name, diff: command.diff }
          this.state.characters = []
          break

        case 'cg':
          this.state.scene = { type: 'cg', name: command.name, diff: command.diff }
          this.state.characters = []
          break

        case 'show': {
          const character = this.state.characters.find((item) => item.name === command.character)
          // 同一角色再次出场时更新差分，保留原有站位。
          if (character) {
            character.diff = command.diff
          } else {
            this.state.characters.push({
              name: command.character,
              diff: command.diff
            })
          }
          break
        }

        case 'bgm':
          this.state.bgm = command.name
          this.audio.playBgm(command.name)
          break

        case 'sfx':
          this.audio.playSfx(command.name)
          break

        case 'narration':
          this.state.speaker = null
          this.state.text = command.text
          return

        case 'dialogue':
          this.state.speaker = command.speaker
          this.state.text = command.text
          if (command.voice) {
            this.audio.playVoice(command.voice)
          }
          return

        case 'load':
          this.commands = getCommands(command.scriptId)
          Object.assign(this.state, initState(command.scriptId))
          this.audio.stopBgm()
          // this.audio.stopVoice()
          this.audio.stopSfx()
          break
      }
    }

    this.state.finished = true
  }

  // 回跳到脚本中指定的文本命令，并按空白基线重建舞台
  jumpTo(index: number): void {
    const target = this.commands[index]
    if (target.type !== 'narration' && target.type !== 'dialogue') return

    // 可见历史都位于当前脚本、当前 pc 之前，前缀中不会出现 load
    // 仅重建舞台状态；新增舞台命令时需同步 advance
    const replayed = initState(this.state.scriptId)
    for (let i = 0; i < index; i++) {
      const command = this.commands[i]
      switch (command.type) {
        case 'bg':
          replayed.scene = { type: 'bg', name: command.name, diff: command.diff }
          replayed.characters = []
          break

        case 'cg':
          replayed.scene = { type: 'cg', name: command.name, diff: command.diff }
          replayed.characters = []
          break

        case 'show': {
          const character = replayed.characters.find((item) => item.name === command.character)
          if (character) {
            character.diff = command.diff
          } else {
            replayed.characters.push({
              name: command.character,
              diff: command.diff
            })
          }
          break
        }

        case 'bgm':
          replayed.bgm = command.name
          break
      }
    }

    replayed.speaker = target.type === 'dialogue' ? target.speaker : null
    replayed.text = target.text
    replayed.pc = index + 1

    Object.assign(this.state, replayed) // 保持 reactive 代理身份
    this.audio.stopVoice()
    this.audio.playBgm(replayed.bgm)
    if (target.type === 'dialogue' && target.voice) {
      this.audio.playVoice(target.voice)
    }
  }
}
