import { parse } from './parser.js'
import type { Command } from '../src/shared/types/command.js'

export { ScriptSyntaxError, parse } from './parser.js'

export interface CompiledScript {
  version: number
  commands: Command[]
}

export function compile(source: string): CompiledScript {
  return { version: 1.0, commands: parse(source) }
}
