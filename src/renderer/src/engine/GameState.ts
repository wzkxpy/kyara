import type { GameState } from '@shared/types/state'

export function initState(): GameState {
  return {
    pc: 0,
    scene: null,
    bgm: null,
    characters: [],
    speaker: null,
    text: '',
    finished: false
  }
}
