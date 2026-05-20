'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { ReactNode } from 'react'

export function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-base font-semibold text-slate-900 flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        {user?.companyName && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium hidden sm:inline">
            {user.companyName}
          </span>
        )}
        <Link href="/profile">
          <Avatar
            name={user?.name || '?'}
            size="sm"
            className="cursor-pointer ring-2 ring-transparent hover:ring-blue-400 transition-all"
          />
        </Link>
      </div>
    </header>
  )
}
