// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { renderHeadTags } from './headTags.ts'
import { HOME_TITLE, OG_IMAGE, SEO_ASSETS, SITE_DESCRIPTION } from './site.ts'

function parseHead(siteUrl: string | undefined) {
  return new DOMParser().parseFromString(
    `<!doctype html><html><head>${renderHeadTags({ siteUrl })}</head><body></body></html>`,
    'text/html',
  ).head
}

const content = (head: HTMLElement, selector: string) =>
  head.querySelector(selector)?.getAttribute('content') ?? null

describe('renderHeadTags without a site URL', () => {
  const head = parseHead(undefined)

  it('renders the title and description', () => {
    expect(head.querySelector('title')?.textContent).toBe(HOME_TITLE)
    expect(content(head, 'meta[name="description"]')).toBe(SITE_DESCRIPTION)
  })

  it('renders Open Graph data that does not require an absolute URL', () => {
    expect(content(head, 'meta[property="og:type"]')).toBe('website')
    expect(content(head, 'meta[property="og:site_name"]')).toBe('Omega Markets')
    expect(content(head, 'meta[property="og:title"]')).toBe(HOME_TITLE)
    expect(content(head, 'meta[property="og:description"]')).toBe(SITE_DESCRIPTION)
    expect(content(head, 'meta[property="og:locale"]')).toBe('es_LA')
  })

  it('omits the social image and uses a summary card without an absolute URL', () => {
    expect(head.querySelector('meta[property="og:image"]')).toBeNull()
    expect(head.querySelector('meta[name="twitter:image"]')).toBeNull()
    expect(content(head, 'meta[name="twitter:card"]')).toBe('summary')
  })

  it('does not set a canonical URL or og:url for every route', () => {
    expect(head.querySelector('link[rel="canonical"]')).toBeNull()
    expect(head.querySelector('meta[property="og:url"]')).toBeNull()
  })

  it('links the manifest, Apple touch icon, and preconnect origins', () => {
    expect(head.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe(
      '/manifest.webmanifest',
    )
    expect(head.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe(
      '/apple-touch-icon.png',
    )
    expect(
      head.querySelector('link[rel="preconnect"][href="https://api.coingecko.com"]'),
    ).not.toBeNull()
    expect(
      head.querySelector('link[rel="preconnect"][href="https://coin-images.coingecko.com"]'),
    ).not.toBeNull()
  })

  it('outputs valid structured data without a URL or image', () => {
    const data = JSON.parse(
      head.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null',
    )

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Omega Markets',
      applicationCategory: 'FinanceApplication',
      isAccessibleForFree: true,
    })
    expect(data).not.toHaveProperty('url')
    expect(data).not.toHaveProperty('image')
  })
})

describe('renderHeadTags with a site URL', () => {
  const head = parseHead('https://omega.example')
  const imageUrl = `https://omega.example${OG_IMAGE.path}`

  it('uses an absolute social image URL and includes its dimensions', () => {
    expect(content(head, 'meta[property="og:image"]')).toBe(imageUrl)
    expect(content(head, 'meta[property="og:image:width"]')).toBe(String(OG_IMAGE.width))
    expect(content(head, 'meta[property="og:image:height"]')).toBe(String(OG_IMAGE.height))
    expect(content(head, 'meta[property="og:image:alt"]')).not.toBe('')
  })

  it('uses a large X card with the same image', () => {
    expect(content(head, 'meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(content(head, 'meta[name="twitter:image"]')).toBe(imageUrl)
  })

  it('includes the URL and image in structured data', () => {
    const data = JSON.parse(
      head.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null',
    )

    expect(data).toMatchObject({ url: 'https://omega.example', image: imageUrl })
  })
})

describe('renderHeadTags hygiene', () => {
  it.each([undefined, 'https://omega.example'] as const)(
    'does not duplicate tags when siteUrl is %s',
    (siteUrl) => {
      const head = parseHead(siteUrl)
      const keys = [...head.querySelectorAll('meta[name], meta[property]')].map(
        (element) => element.getAttribute('name') ?? element.getAttribute('property'),
      )

      expect(new Set(keys).size).toBe(keys.length)
      expect(head.querySelectorAll('title')).toHaveLength(1)
    },
  )

  it('escapes less-than characters in JSON-LD so values cannot close the script', () => {
    const html = renderHeadTags({ siteUrl: 'https://omega.example</script><script>alert(1)' })
    const script = html.slice(html.indexOf('<script'), html.lastIndexOf('</script>'))

    expect(script.slice('<script type="application/ld+json">'.length)).not.toContain('<')
  })

  it('references only images declared in SEO_ASSETS', () => {
    const declared = SEO_ASSETS.map((asset) => asset.path)
    const referenced = [
      ...parseHead('https://omega.example').querySelectorAll('link[rel="apple-touch-icon"]'),
    ].map((element) => element.getAttribute('href'))

    referenced.forEach((href) => expect(declared).toContain(href))
  })
})
