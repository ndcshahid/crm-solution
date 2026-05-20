import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'

export async function getSession() {
  return getServerSession(authOptions)
}

// Full user record with role+permissions — used server-side
export async function requireAuth(req: NextRequest): Promise<
  { user: null; error: NextResponse } | { user: any; error: null }
> {
  const session = await getSession()
  if (!session?.user?.email) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      company: true,
      teams: true,
    },
  })

  if (!user) return { user: null, error: NextResponse.json({ error: 'User not found' }, { status: 401 }) }
  if (user.status !== 'active') return { user: null, error: NextResponse.json({ error: 'Account deactivated' }, { status: 403 }) }

  return { user, error: null }
}

export function hasPermission(user: any, permission: string): boolean {
  return user?.role?.permissions?.some((rp: any) => rp.permission.name === permission) ?? false
}

export function requirePermission(user: any, permission: string): NextResponse | null {
  if (!hasPermission(user, permission)) {
    return NextResponse.json({ error: `Forbidden: requires ${permission}` }, { status: 403 })
  }
  return null
}

/** Build a Prisma `where` filter that scopes leads to what this user is allowed to see */
export function buildLeadFilter(user: any): Record<string, any> {
  const role = user.role.name
  if (role === 'super_admin') return {}
  if (role === 'admin') return { companyId: user.companyId }
  if (role === 'sales_manager') {
    const teamIds = user.teams.map((ut: any) => ut.teamId)
    return { companyId: user.companyId, teamId: { in: teamIds.length ? teamIds : ['__none__'] } }
  }
  // sales_executive or viewer
  return { companyId: user.companyId, assignedToId: user.id }
}
