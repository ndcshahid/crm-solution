import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const updated = await prisma.followUp.update({
    where: { id: params.id },
    data: {
      status: body.status,
      note:   body.note !== undefined ? body.note : undefined,
    },
    include: { lead: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } },
  })

  if (body.status === 'Completed') {
    await prisma.activity.create({
      data: { userId: user.id, companyId: user.companyId, leadId: updated.leadId, action: 'Follow Up Completed', module: 'Follow Ups', recordName: updated.lead.name },
    })
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(req)
  if (error) return error

  await prisma.followUp.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
