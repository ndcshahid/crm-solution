import { ReactNode } from 'react'

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-[3px]' }
  return <div className={`${s[size]} border-slate-200 border-t-blue-600 rounded-full animate-spin`} />
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="font-semibold text-slate-600 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-400 mb-5 max-w-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}
