import { Bell, Briefcase, History, LayoutDashboard, LineChart, Settings, Star } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  end?: boolean
  /** En móvil: en la barra inferior o dentro del menú "Más". */
  mobile: 'bar' | 'more'
}

export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    description: 'Resumen general',
    icon: LayoutDashboard,
    end: true,
    mobile: 'bar',
  },
  {
    to: '/markets',
    label: 'Markets',
    description: 'Mercados globales',
    icon: LineChart,
    mobile: 'bar',
  },
  {
    to: '/portfolio',
    label: 'Portfolio',
    description: 'Portafolio virtual',
    icon: Briefcase,
    mobile: 'bar',
  },
  {
    to: '/watchlist',
    label: 'Watchlist',
    description: 'Activos favoritos',
    icon: Star,
    mobile: 'bar',
  },
  {
    to: '/alerts',
    label: 'Alerts',
    description: 'Alertas de precio',
    icon: Bell,
    mobile: 'more',
  },
  {
    to: '/history',
    label: 'History',
    description: 'Historial de operaciones',
    icon: History,
    mobile: 'more',
  },
  {
    to: '/settings',
    label: 'Settings',
    description: 'Preferencias',
    icon: Settings,
    mobile: 'more',
  },
]

export const barNavItems = navItems.filter((item) => item.mobile === 'bar')
export const moreNavItems = navItems.filter((item) => item.mobile === 'more')
