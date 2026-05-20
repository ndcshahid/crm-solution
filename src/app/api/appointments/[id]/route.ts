import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_edit_appointment')
  if (pe) return pe

  const body = await req.json()
  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      meetingType: body.meetingType,
      location:    body.location,
      status:      body.status,
      notes:       body.notes,
    },
    include: {
      lead: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ data: updated })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const { status } = await req.json()
  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: { status },
    include: { lead: { select: { id: true, name: true } } },
  })

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, leadId: updated.leadId, action: `Appointment ${status}`, module: 'Appointments', recordName: updated.lead.name },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_delete_appointment')
  if (pe) return pe

  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
