import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const where = user.role.name === 'super_admin' ? {} : { companyId: user.companyId }
  const teams = await prisma.team.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true, role: { select: { name: true, label: true } } } } } },
      _count:  { select: { leads: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ data: teams })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_manage_teams')
  if (pe) return pe

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'Team name required' }, { status: 400 })

  const team = await prisma.team.create({
    data: {
      name:      body.name,
      companyId: user.companyId,
      managerId: body.managerId || null,
    },
    include: { manager: { select: { id: true, name: true } } },
  })

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, action: 'Team Created', module: 'Teams', recordName: team.name },
  })

  return NextResponse.json({ data: team }, { status: 201 })
}
