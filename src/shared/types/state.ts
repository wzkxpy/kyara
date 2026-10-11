export interface GameState {
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
  voice: string | null

  finished: boolean
}
