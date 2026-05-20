import { cn } from '@/lib/utils'
import { STATUS_COLORS, PRIORITY_COLORS, ROLE_COLORS, ROLE_LABELS } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('badge', PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-600')}>
      {priority}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn('badge', ROLE_COLORS[role] || 'bg-slate-100 text-slate-600')}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}
