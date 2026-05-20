import { cn, getInitials } from '@/lib/utils'

const PALETTE = ['#2563eb','#0891b2','#059669','#7c3aed','#d97706','#dc2626','#db2777','#0284c7']

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const color = PALETTE[(name || '?').charCodeAt(0) % PALETTE.length]
  const sizes  = { xs: 'w-6 h-6 text-[9px]', sm: 'w-7 h-7 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none', sizes[size], className)}
      style={{ background: color }}
    >
      {getInitials(name || '?')}
    </div>
  )
}
