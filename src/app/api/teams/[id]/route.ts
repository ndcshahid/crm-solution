import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_manage_teams')
  if (pe) return pe

  const body = await req.json()
  const team = await prisma.team.update({
    where: { id: params.id },
    data: { name: body.name, managerId: body.managerId || null },
    include: { manager: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ data: team })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_manage_teams')
  if (pe) return pe

  await prisma.team.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Team deleted' })
}
