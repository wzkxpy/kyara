// src/shared/types/state.ts
export interface GameState {
  scriptId: string
  pc: number

  scene: {
    type: 'bg' | 'cg'
    name: string
    diff: string
  } | null

  bgm: string | null

  characters: {
    name: string
    diff: string
  }[]

  speaker: string | null
  text: string

  finished: boolean
}
