import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  if (user.role.name !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true, leads: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ data: companies })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  if (user.role.name !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.name || !body.email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

  const existing = await prisma.company.findUnique({ where: { email: body.email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const company = await prisma.company.create({
    data: {
      name:   body.name,
      email:  body.email,
      phone:  body.phone  || null,
      plan:   body.plan   || 'Starter',
      status: 'active',
    },
  })
  return NextResponse.json({ data: company }, { status: 201 })
}
