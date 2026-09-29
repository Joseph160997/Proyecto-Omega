import {
  Bell,
  Briefcase,
  History,
  LayoutDashboard,
  LineChart,
  Settings,
  Star,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  end?: boolean
}

export const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    description: 'Resumen general',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/markets',
    label: 'Markets',
    description: 'Mercados globales',
    icon: LineChart,
  },
  {
    to: '/portfolio',
    label: 'Portfolio',
    description: 'Portafolio virtual',
    icon: Briefcase,
  },
  {
    to: '/watchlist',
    label: 'Watchlist',
    description: 'Activos favoritos',
    icon: Star,
  },
  {
    to: '/alerts',
    label: 'Alerts',
    description: 'Alertas de precio',
    icon: Bell,
  },
  {
    to: '/history',
    label: 'History',
    description: 'Historial de operaciones',
    icon: History,
  },
  {
    to: '/settings',
    label: 'Settings',
    description: 'Preferencias',
    icon: Settings,
  },
]