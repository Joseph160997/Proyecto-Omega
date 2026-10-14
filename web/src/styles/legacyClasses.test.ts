/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url))
const THIS_FILE = 'legacyClasses.test.ts'

// Clases con variables CSS "a mano", como bg-(--surface). Se construye por partes para
// que este mismo archivo no coincida con su propio patrón.
const LEGACY = new RegExp('-\\(' + '--')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}${entry.name}`

    if (entry.isDirectory()) return sourceFiles(`${path}/`)

    return /\.(ts|tsx)$/.test(entry.name) && entry.name !== THIS_FILE ? [path] : []
  })
}

describe('styles', () => {
  const files = sourceFiles(SRC_DIR)

  it('finds project source files (prevents passing vacuously)', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('no class uses direct CSS variables: use semantic tokens (bg-panel, text-fg...)', () => {
    const offenders = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          LEGACY.test(line) ? [`${file.replace(SRC_DIR, 'src/')}:${index + 1}`] : [],
        ),
    )

    expect(offenders).toEqual([])
  })
})
