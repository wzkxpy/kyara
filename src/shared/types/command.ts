// shared/types/command.ts

export type Command =
  | { type: 'narration'; text: string }
  | { type: 'dialogue'; speaker: string; text: string; voice?: string }
  | { type: 'bg'; name: string }
  | { type: 'cg'; name: string }
  | { type: 'bgm'; name: string }
  | { type: 'sfx'; name: string }
  | { type: 'show'; character: string; expression: string }
