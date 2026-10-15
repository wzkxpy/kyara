import type { GameState } from '@shared/types/state'

export function initState(scriptId: string): GameState {
  return {
    scriptId,
    pc: 0,
    scene: null,
    bgm: null,
    characters: [],
    speaker: null,
    text: '',
    finished: false
  }
}
