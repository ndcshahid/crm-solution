import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const company = await prisma.company.findUnique({ where: { id: user.companyId } })
  const roles   = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } })

  return NextResponse.json({ data: { company, roles } })
}

export async function PUT(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_manage_settings')
  if (pe) return pe

  const body = await req.json()
  const updated = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name:     body.name,
      phone:    body.phone    || null,
      address:  body.address  || null,
      timezone: body.timezone || 'America/New_York',
      currency: body.currency || 'USD',
    },
  })
  return NextResponse.json({ data: updated })
}
