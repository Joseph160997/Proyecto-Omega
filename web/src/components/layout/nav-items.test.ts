import { describe, expect, it } from 'vitest'

import { barNavItems, moreNavItems, navItems } from '@/components/layout/nav-items'

describe('navItems', () => {
  it('each route appears once and starts with "/"', () => {
    const routes = navItems.map((item) => item.to)

    expect(new Set(routes).size).toBe(routes.length)
    routes.forEach((route) => expect(route.startsWith('/')).toBe(true))
  })

  it('every item has a name and description', () => {
    navItems.forEach((item) => {
      expect(item.label).not.toBe('')
      expect(item.description).not.toBe('')
    })
  })

  it('the mobile menu puts four items in the bar and the rest under More', () => {
    expect(barNavItems.map((item) => item.label)).toEqual([
      'Dashboard',
      'Markets',
      'Portfolio',
      'Watchlist',
    ])
    expect(moreNavItems.map((item) => item.label)).toEqual(['Alerts', 'History', 'Settings'])
    expect(barNavItems.length + moreNavItems.length).toBe(navItems.length)
  })

  it('Dashboard is active only at the exact "/" path', () => {
    expect(navItems.find((item) => item.to === '/')?.end).toBe(true)
  })
})
