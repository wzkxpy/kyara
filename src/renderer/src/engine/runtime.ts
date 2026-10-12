import type { Command } from '@shared/types/command'
import type { GameState } from '@shared/types/state'
import type { AudioManager } from './AudioManager'
import { useSettingsStore } from '@renderer/stores/settings'

export class Runtime {
  constructor(
    private commands: Command[],
    private state: GameState,
    private audio: AudioManager
  ) {}

  advance(): void {
    if (this.state.finished) return

    // 根据设置决定翻页时是否打断语音
    const settingsStore = useSettingsStore()
    if (settingsStore.settings.interruptSpeech) {
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

        case 'show':
          this.state.characters.push({
            name: command.character,
            expression: command.expression
          })
          break

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
      }
    }

    this.state.finished = true
  }
}
