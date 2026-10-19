// src/renderer/engine/Runtime.ts
import type { Command } from '@shared/types/command'
import type { GameState } from '@shared/types/state'
import type { AudioManager } from './AudioManager'
import type { Settings } from '@shared/types/settings'
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
          this.state.scene = { type: 'bg', name: command.name }
          this.state.characters = []
          break

        case 'cg':
          this.state.scene = { type: 'cg', name: command.name }
          this.state.characters = []
          break

        case 'show': {
          const character = this.state.characters.find((item) => item.name === command.character)
          // 同一角色再次出场时更新表情，保留原有站位。
          if (character) {
            character.expression = command.expression
          } else {
            this.state.characters.push({
              name: command.character,
              expression: command.expression
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
          this.state.pc = 0
          this.state.scriptId = command.scriptId
          break
      }
    }

    this.state.finished = true
  }
}
