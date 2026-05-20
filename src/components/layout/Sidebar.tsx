'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { usePermission, useRole } from '@/components/ui/PermGuard'

const NAV = [
  {
    group: 'OVERVIEW',
    items: [
      { href: '/dashboard',    label: 'Dashboard',      perm: null, role: null },
    ],
  },
  {
    group: 'SALES',
    items: [
      { href: '/leads',        label: 'Leads',          perm: null, role: null },
      { href: '/pipeline',     label: 'Pipeline',       perm: null, role: null },
      { href: '/follow-ups',   label: 'Follow Ups',     perm: null, role: null },
      { href: '/appointments', label: 'Appointments',   perm: null, role: null },
    ],
  },
  {
    group: 'ANALYTICS',
    items: [
      { href: '/reports',      label: 'Reports',        perm: 'can_view_reports', role: null },
    ],
  },
  {
    group: 'MANAGEMENT',
    items: [
      { href: '/users',        label: 'Users',          perm: 'can_create_user',    role: null },
      { href: '/teams',        label: 'Teams',          perm: 'can_manage_teams',   role: null },
      { href: '/companies',    label: 'Companies',      perm: null,                 role: 'super_admin' },
      { href: '/settings',     label: 'Settings',       perm: 'can_manage_settings', role: null },
    ],
  },
]

// SVG icons keyed by href
const ICONS: Record<string, JSX.Element> = {
  '/dashboard':    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  '/leads':        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  '/pipeline':     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  '/follow-ups':   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  '/appointments': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  '/reports':      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  '/users':        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  '/teams':        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  '/companies':    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  '/settings':     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = useRole()
  const user = session?.user as any

  const canCreateUser    = usePermission('can_create_user')
  const canManageTeams   = usePermission('can_manage_teams')
  const canViewReports   = usePermission('can_view_reports')
  const canManageSettings = usePermission('can_manage_settings')

  function visible(item: { perm: string | null; role: string | null }) {
    if (item.role === 'super_admin' && role !== 'super_admin') return false
    if (item.perm === 'can_create_user'     && !canCreateUser)     return false
    if (item.perm === 'can_manage_teams'    && !canManageTeams)    return false
    if (item.perm === 'can_view_reports'    && !canViewReports)    return false
    if (item.perm === 'can_manage_settings' && !canManageSettings) return false
    return true
  }

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <aside className="w-56 min-w-[224px] flex flex-col h-screen" style={{ background: '#0f172a' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-white font-bold text-base tracking-tight">⚡ CRM Solution</div>
        <div className="text-slate-500 text-xs mt-0.5">Sales Management</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(group => {
          const items = group.items.filter(visible)
          if (!items.length) return null
          return (
            <div key={group.group} className="mb-2">
              <p className="px-5 py-1 text-[10px] font-bold text-slate-600 tracking-widest">{group.group}</p>
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  {ICONS[item.href]}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Avatar name={user?.name || '?'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.name}</p>
            <RoleBadge role={user?.role || ''} />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
