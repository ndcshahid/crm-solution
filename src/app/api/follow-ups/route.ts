import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission, buildLeadFilter } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all'

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const where: any = {}

  // Scope by role
  if (user.role.name === 'sales_executive') {
    where.userId = user.id
  } else if (user.role.name !== 'super_admin') {
    // admin / manager — scope to company via lead
    where.lead = { companyId: user.companyId }
  }

  if (filter === 'today')    { where.scheduledAt = { gte: today, lt: tomorrow } }
  if (filter === 'upcoming') { where.scheduledAt = { gte: tomorrow }; where.status = 'Pending' }
  if (filter === 'overdue')  { where.scheduledAt = { lt: today };     where.status = 'Pending' }

  const followUps = await prisma.followUp.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, status: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 200,
  })

  return NextResponse.json({ data: followUps })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_add_follow_up')
  if (pe) return pe

  const body = await req.json()
  if (!body.leadId || !body.scheduledAt) {
    return NextResponse.json({ error: 'leadId and scheduledAt are required' }, { status: 400 })
  }

  const followUp = await prisma.followUp.create({
    data: {
      leadId:      body.leadId,
      userId:      user.id,
      scheduledAt: new Date(body.scheduledAt),
      note:        body.note || null,
      status:      'Pending',
    },
    include: {
      lead: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  })

  await prisma.activity.create({
    data: { userId: user.id, companyId: user.companyId, leadId: body.leadId, action: 'Follow Up Added', module: 'Follow Ups', recordName: followUp.lead.name },
  })

  return NextResponse.json({ data: followUp }, { status: 201 })
}
