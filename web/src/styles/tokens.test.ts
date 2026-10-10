/// <reference types="node" />
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// Se lee con fs y no con `import css from '...?raw'`: Vitest no procesa archivos CSS
// por defecto y devolvería un string vacío.
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

type Rgb = readonly [number, number, number]
type Tokens = Record<string, string>

interface Color {
  rgb: Rgb
  alpha: number
}

const BLOCKS = {
  root: /(?:^|\n):root\s*\{([^}]*)\}/g,
  dark: /(?:^|\n)\.dark\s*\{([^}]*)\}/g,
}

/** Variables declaradas en todos los bloques con ese selector (unidos). */
function readTokens(pattern: RegExp): Tokens {
  const tokens: Tokens = {}

  for (const block of css.matchAll(pattern)) {
    for (const declaration of (block[1] ?? '').matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, value] = declaration

      if (name !== undefined && value !== undefined) tokens[name] = value.trim()
    }
  }

  return tokens
}

const root = readTokens(BLOCKS.root)
const dark = readTokens(BLOCKS.dark)
const THEMES: Record<string, Tokens> = { light: root, dark: { ...root, ...dark } }

function parseColor(value: string): Color {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1]

  if (hex !== undefined) {
    const n = parseInt(hex, 16)

    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 }
  }

  const fn = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(value)

  if (fn !== null) {
    return {
      rgb: [Number(fn[1]), Number(fn[2]), Number(fn[3])],
      alpha: fn[4] === undefined ? 1 : Number(fn[4]),
    }
  }

  throw new Error(`Color no soportado por el test: ${value}`)
}

function tokenColor(theme: Tokens, name: string): Color {
  const value = theme[name]

  if (value === undefined) throw new Error(`Falta el token --${name}`)

  return parseColor(value)
}

/** Color con transparencia sobre un fondo opaco. */
function over(top: Color, bottom: Color): Rgb {
  const mix = (i: 0 | 1 | 2) => Math.round(top.rgb[i] * top.alpha + bottom.rgb[i] * (1 - top.alpha))

  return [mix(0), mix(1), mix(2)]
}

function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)

  return ((light ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

const SURFACES = ['canvas', 'sidebar', 'panel', 'raised']
const TEXTS = ['fg', 'fg-muted', 'fg-subtle', 'accent', 'up', 'down', 'warning', 'info']
const AA = 4.5

describe.each(Object.keys(THEMES))('tokens de color (%s)', (themeName) => {
  const theme = THEMES[themeName] ?? {}
  const rgbOf = (name: string) => tokenColor(theme, name).rgb

  it.each(TEXTS.flatMap((text) => SURFACES.map((surface) => [text, surface] as [string, string])))(
    '%s sobre %s cumple contraste AA',
    (text, surface) => {
      expect(contrast(rgbOf(text), rgbOf(surface))).toBeGreaterThanOrEqual(AA)
    },
  )

  it.each([
    ['up', 'up-soft'],
    ['down', 'down-soft'],
  ])('el chip %s legible sobre %s, en panel y en fila con hover', (text, soft) => {
    for (const surface of ['panel', 'raised']) {
      const chipBackground = over(tokenColor(theme, soft), tokenColor(theme, surface))

      expect(contrast(rgbOf(text), chipBackground)).toBeGreaterThanOrEqual(AA)
    }
  })

  it('el texto sobre el relleno del acento cumple AA', () => {
    expect(contrast(rgbOf('on-accent'), rgbOf('accent-fill'))).toBeGreaterThanOrEqual(AA)
  })

  it('el anillo de foco (accent) se ve sobre fondo y panel (3:1)', () => {
    expect(contrast(rgbOf('accent'), rgbOf('canvas'))).toBeGreaterThanOrEqual(3)
    expect(contrast(rgbOf('accent'), rgbOf('panel'))).toBeGreaterThanOrEqual(3)
  })
})

describe('paridad entre temas', () => {
  const isAlias = (value: string | undefined) => value?.startsWith('var(') ?? false

  it('todo token propio del tema claro también está en el oscuro', () => {
    const missing = Object.entries(root)
      .filter(([name, value]) => !isAlias(value) && !(name in dark))
      .map(([name]) => name)

    expect(missing).toEqual([])
  })

  it('el tema oscuro no declara tokens que el claro no tenga', () => {
    expect(Object.keys(dark).filter((name) => !(name in root))).toEqual([])
  })
})

describe('lectura del CSS', () => {
  it('encuentra los tokens de los dos temas (evita pasar en vacío)', () => {
    expect(Object.keys(root).length).toBeGreaterThan(15)
    expect(Object.keys(dark).length).toBeGreaterThan(15)
    expect(root.fg).toBeDefined()
    expect(dark.fg).toBeDefined()
  })
})
