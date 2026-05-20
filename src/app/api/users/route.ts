import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const CreateSchema = z.object({
  name:         z.string().min(2),
  email:        z.string().email(),
  password:     z.string().min(8),
  phone:        z.string().optional(),
  roleId:       z.string().min(1),
  departmentId: z.string().optional(),
  managerId:    z.string().optional(),
  teamId:       z.string().optional(),
  companyId:    z.string().optional(), // super_admin only
})

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'))
  const search = searchParams.get('search') || ''
  const roleFilter = searchParams.get('role') || ''

  const where: any = {}
  if (user.role.name !== 'super_admin') where.companyId = user.companyId
  if (search) where.OR = [
    { name:  { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ]
  if (roleFilter) where.role = { name: roleFilter }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, status: true,
        lastLoginAt: true, createdAt: true, companyId: true, departmentId: true, managerId: true,
        role:       { select: { id: true, name: true, label: true } },
        company:    { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        teams:      { include: { team: { select: { id: true, name: true } } } },
        manager:    { select: { id: true, name: true } },
        _count:     { select: { assignedLeads: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ data: users, meta: { total, page, limit } })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_create_user')
  if (pe) return pe

  try {
    const body = await req.json()
    const data = CreateSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const companyId = (user.role.name === 'super_admin' && data.companyId) ? data.companyId : user.companyId
    const hashed    = await bcrypt.hash(data.password, 12)

    const created = await prisma.user.create({
      data: {
        name:         data.name,
        email:        data.email,
        password:     hashed,
        phone:        data.phone || null,
        roleId:       data.roleId,
        companyId,
        departmentId: data.departmentId || null,
        managerId:    data.managerId    || null,
        status:       'active',
      },
      select: { id: true, name: true, email: true, status: true, createdAt: true, role: { select: { name: true, label: true } } },
    })

    if (data.teamId) {
      await prisma.userTeam.create({ data: { userId: created.id, teamId: data.teamId } })
    }

    await prisma.activity.create({
      data: { userId: user.id, companyId: user.companyId, action: 'User Created', module: 'Users', recordName: created.name },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
