/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const html = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8')

describe('index.html', () => {
  it('has exactly one marker for SEO tag injection', () => {
    expect(html.split('<!-- seo:head -->')).toHaveLength(2)
  })

  it('does not duplicate the title or description injected by the plugin', () => {
    expect(html).not.toMatch(/<title[\s>]/)
    expect(html).not.toMatch(/name=["']description["']/)
  })

  it('declares the document language and mobile viewport', () => {
    expect(html).toMatch(/<html lang="es">/)
    expect(html).toMatch(/name="viewport"/)
  })

  it('runs the theme script before loading the application', () => {
    expect(html.indexOf('omega-markets:settings:theme:v1')).toBeGreaterThan(-1)
    expect(html.indexOf('omega-markets:settings:theme:v1')).toBeLessThan(
      html.indexOf('/src/main.tsx'),
    )
  })
})
