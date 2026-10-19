// shared/types/command.ts

export type Command =
  | { type: 'narration'; text: string }
  | { type: 'dialogue'; speaker: string; text: string; voice?: string }
  | { type: 'bg'; name: string; diff: string }
  | { type: 'cg'; name: string; diff: string }
  | { type: 'bgm'; name: string }
  | { type: 'sfx'; name: string }
  | { type: 'show'; character: string; diff: string }
  | { type: 'hide'; character: string }
  | { type: 'load'; scriptId: string }
