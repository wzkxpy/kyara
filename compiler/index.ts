import { parse } from './parser.js'
import type { ScriptCommand } from '../src/shared/types/script'

export { ScriptSyntaxError, parse } from './parser.js'

export interface CompiledScript {
  version: number
  commands: ScriptCommand[]
}

export function compile(source: string): CompiledScript {
  return { version: 1.0, commands: parse(source) }
}
