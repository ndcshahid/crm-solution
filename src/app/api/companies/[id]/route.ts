import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  if (user.role.name !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const company = await prisma.company.update({
    where: { id: params.id },
    data: { name: body.name, phone: body.phone, address: body.address, plan: body.plan, status: body.status },
  })
  return NextResponse.json({ data: company })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  if (user.role.name !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json()
  const company = await prisma.company.update({ where: { id: params.id }, data: { status } })
  return NextResponse.json({ data: company })
}
