import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission, buildLeadFilter, hasPermission } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      assignedTo:  { select: { id: true, name: true, email: true } },
      team:        { select: { id: true, name: true } },
      createdBy:   { select: { id: true, name: true } },
      followUps: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { scheduledAt: 'desc' },
      },
      appointments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { scheduledAt: 'desc' },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  })

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // Scope check
  const filter = buildLeadFilter(user)
  if (filter.companyId && lead.companyId !== filter.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (filter.assignedToId && lead.assignedToId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ data: lead })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_edit_lead')
  if (pe) return pe

  const existing = await prisma.lead.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const body = await req.json()
  const oldStatus = existing.status

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: {
      name:           body.name,
      contactName:    body.contactName,
      email:          body.email || null,
      phone:          body.phone || null,
      city:           body.city  || null,
      source:         body.source,
      status:         body.status,
      priority:       body.priority,
      dealValue:      parseFloat(body.dealValue) || 0,
      notes:          body.notes || null,
      assignedToId:   body.assignedToId || null,
      teamId:         body.teamId       || null,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      team:       { select: { id: true, name: true } },
    },
  })

  if (oldStatus !== updated.status) {
    await prisma.activity.create({
      data: {
        userId: user.id, companyId: user.companyId, leadId: updated.id,
        action: 'Status Updated', module: 'Leads',
        recordName: `${updated.name}: ${oldStatus} → ${updated.status}`,
        oldValue: oldStatus, newValue: updated.status,
      },
    })
  } else {
    await prisma.activity.create({
      data: { userId: user.id, companyId: user.companyId, leadId: updated.id, action: 'Lead Updated', module: 'Leads', recordName: updated.name },
    })
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_delete_lead')
  if (pe) return pe

  const lead = await prisma.lead.findUnique({ where: { id: params.id } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (user.role.name !== 'super_admin' && lead.companyId !== user.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.lead.delete({ where: { id: params.id } })

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, action: 'Lead Deleted', module: 'Leads', recordName: lead.name },
  })

  return NextResponse.json({ message: 'Lead deleted successfully' })
}
