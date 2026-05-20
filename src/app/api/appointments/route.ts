import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission, buildLeadFilter } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const where: any = {}
  if (user.role.name === 'sales_executive') {
    where.userId = user.id
  } else if (user.role.name !== 'super_admin') {
    where.lead = { companyId: user.companyId }
  }
  if (status) where.status = status

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, contactName: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json({ data: appointments })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_create_appointment')
  if (pe) return pe

  const body = await req.json()
  if (!body.leadId || !body.scheduledAt) {
    return NextResponse.json({ error: 'leadId and scheduledAt are required' }, { status: 400 })
  }

  const appt = await prisma.appointment.create({
    data: {
      leadId:      body.leadId,
      userId:      user.id,
      scheduledAt: new Date(body.scheduledAt),
      meetingType: body.meetingType || 'Phone Call',
      location:    body.location   || null,
      notes:       body.notes      || null,
      status:      'Scheduled',
    },
    include: {
      lead: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  })

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, leadId: body.leadId, action: 'Appointment Created', module: 'Appointments', recordName: appt.lead.name },
  })

  return NextResponse.json({ data: appt }, { status: 201 })
}
