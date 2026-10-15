import { describe, expect, it } from 'vitest'

import { renderRobots, renderSitemap } from './crawlers.ts'

describe('renderRobots', () => {
  it('allows all crawlers when the site URL is not configured', () => {
    expect(renderRobots(undefined)).toBe('User-agent: *\nAllow: /\n')
  })

  it('points crawlers to the sitemap when the site URL is configured', () => {
    expect(renderRobots('https://omega.example')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://omega.example/sitemap.xml\n',
    )
  })
})

describe('renderSitemap', () => {
  it('lists only indexable pages with absolute URLs', () => {
    const xml = renderSitemap('https://omega.example')
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])

    expect(locations).toEqual(['https://omega.example/', 'https://omega.example/markets'])
  })

  it('returns well-formed XML with the standard namespace', () => {
    const xml = renderSitemap('https://omega.example')

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml.trim().endsWith('</urlset>')).toBe(true)
  })

  it('does not invent last-modified dates', () => {
    expect(renderSitemap('https://omega.example')).not.toContain('lastmod')
  })

  it('escapes XML special characters', () => {
    expect(renderSitemap('https://omega.example', ['/a&b'])).toContain(
      '<loc>https://omega.example/a&amp;b</loc>',
    )
  })
})
