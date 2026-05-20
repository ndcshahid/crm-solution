'use client'
import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'

/** Renders children only if the current user has the given permission */
export function PermGuard({ permission, children, fallback = null }: {
  permission: string; children: ReactNode; fallback?: ReactNode
}) {
  const { data: session } = useSession()
  const perms: string[] = (session?.user as any)?.permissions || []
  return perms.includes(permission) ? <>{children}</> : <>{fallback}</>
}

/** Returns true if the user has the given permission */
export function usePermission(permission: string): boolean {
  const { data: session } = useSession()
  const perms: string[] = (session?.user as any)?.permissions || []
  return perms.includes(permission)
}

/** Returns the current user's role name */
export function useRole(): string {
  const { data: session } = useSession()
  return (session?.user as any)?.role || ''
}

/** Returns the full session user object */
export function useCurrentUser() {
  const { data: session } = useSession()
  return session?.user as any
}
