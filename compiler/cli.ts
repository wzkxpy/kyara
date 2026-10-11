import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from './index.js'

async function main(): Promise<void> {
  const [, , inputArg, outputArg] = process.argv
  if (!inputArg || !outputArg || process.argv.length !== 4) {
    console.error('Usage: npm run compile:script -- <input.vn> <output.json>')
    process.exitCode = 1
    return
  }

  const inputPath = resolve(inputArg)
  const outputPath = resolve(outputArg)
  const source = await readFile(inputPath, 'utf8')
  const result = compile(source)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.log(`Compiled ${result.commands.length} commands: ${outputPath}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
