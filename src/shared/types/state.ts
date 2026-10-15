// src/shared/types/state.ts
export interface GameState {
  scriptId: string
  pc: number

  scene: {
    type: 'bg' | 'cg'
    name: string
  } | null

  bgm: string | null

  characters: {
    name: string
    expression: string
  }[]

  speaker: string | null
  text: string

  finished: boolean
}
