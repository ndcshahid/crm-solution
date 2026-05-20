import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']
export const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
export const LEAD_SOURCES = ['Website', 'Referral', 'Facebook', 'LinkedIn', 'WhatsApp', 'Cold Call', 'Email Campaign', 'Walk In', 'Other']
export const MEETING_TYPES = ['Phone Call', 'Online Meeting', 'Office Visit', 'Client Visit', 'Demo', 'Follow Up Meeting']

export const STATUS_COLORS: Record<string, string> = {
  New:             'bg-blue-100 text-blue-800',
  Contacted:       'bg-yellow-100 text-yellow-800',
  Qualified:       'bg-green-100 text-green-800',
  'Proposal Sent': 'bg-purple-100 text-purple-800',
  Won:             'bg-emerald-100 text-emerald-800',
  Lost:            'bg-red-100 text-red-800',
  Scheduled:       'bg-blue-100 text-blue-800',
  Completed:       'bg-green-100 text-green-800',
  Cancelled:       'bg-red-100 text-red-800',
  Missed:          'bg-orange-100 text-orange-800',
  Pending:         'bg-yellow-100 text-yellow-800',
  active:          'bg-green-100 text-green-800',
  inactive:        'bg-red-100 text-red-800',
}

export const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
}

export const ROLE_COLORS: Record<string, string> = {
  super_admin:     'bg-amber-100 text-amber-800',
  admin:           'bg-blue-100 text-blue-800',
  sales_manager:   'bg-green-100 text-green-800',
  sales_executive: 'bg-purple-100 text-purple-800',
  viewer:          'bg-slate-100 text-slate-600',
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin',
  sales_manager: 'Sales Manager', sales_executive: 'Sales Executive', viewer: 'Viewer',
}
