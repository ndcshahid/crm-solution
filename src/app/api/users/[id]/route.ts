import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const userSelect = {
  id: true, name: true, email: true, phone: true, status: true,
  lastLoginAt: true, createdAt: true, companyId: true, departmentId: true, managerId: true,
  role:       { select: { id: true, name: true, label: true } },
  company:    { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  manager:    { select: { id: true, name: true } },
  teams:      { include: { team: { select: { id: true, name: true } } } },
} as const

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: userSelect })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role.name !== 'super_admin' && target.companyId !== user.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ data: target })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_edit_user')
  if (pe) return pe

  const body = await req.json()
  const updateData: any = {
    name:         body.name,
    phone:        body.phone || null,
    departmentId: body.departmentId || null,
    managerId:    body.managerId    || null,
  }
  if (body.roleId) updateData.roleId = body.roleId
  if (body.password) updateData.password = await bcrypt.hash(body.password, 12)

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: userSelect,
  })

  // Update team membership
  if (body.teamId !== undefined) {
    await prisma.userTeam.deleteMany({ where: { userId: params.id } })
    if (body.teamId) await prisma.userTeam.create({ data: { userId: params.id, teamId: body.teamId } })
  }

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, action: 'User Updated', module: 'Users', recordName: updated.name },
  })

  return NextResponse.json({ data: updated })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_deactivate_user')
  if (pe) return pe

  const { status } = await req.json()
  if (!['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { status },
    select: userSelect,
  })

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, action: `User ${status === 'active' ? 'Activated' : 'Deactivated'}`, module: 'Users', recordName: updated.name },
  })

  return NextResponse.json({ data: updated })
}
