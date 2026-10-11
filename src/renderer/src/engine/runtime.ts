import type { ScriptCommand } from '@shared/types/script'
import type { GameState } from '@shared/types/state'

export class Runtime {
  constructor(
    private commands: ScriptCommand[],
    private state: GameState
  ) {}

  advance(): void {
    if (this.state.finished) return

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

        case 'bgm':
          this.state.bgm = command.name
          break

        case 'sfx':
          // this.state.sfx = command.name
          break

        case 'show':
          this.state.characters.push({
            name: command.character,
            expression: command.expression
          })
          break

        case 'narration':
          this.state.speaker = null
          this.state.voice = null
          this.state.text = command.text
          return

        case 'dialogue':
          this.state.speaker = command.speaker
          this.state.text = command.text
          this.state.voice = command.voice ?? null
          return
      }
    }

    this.state.finished = true
  }
}
