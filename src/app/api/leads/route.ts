import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission, buildLeadFilter } from '@/lib/auth'
import { z } from 'zod'

const CreateSchema = z.object({
  name:           z.string().min(1),
  contactName:    z.string().min(1),
  email:          z.string().email().optional().or(z.literal('')),
  phone:          z.string().optional(),
  city:           z.string().optional(),
  source:         z.string().default('Website'),
  status:         z.string().default('New'),
  priority:       z.string().default('Medium'),
  dealValue:      z.number().min(0).default(0),
  notes:          z.string().optional(),
  assignedToId:   z.string().optional(),
  teamId:         z.string().optional(),
  nextFollowUpAt: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit    = Math.min(200, parseInt(searchParams.get('limit') || '20'))
  const search   = searchParams.get('search')   || ''
  const status   = searchParams.get('status')   || ''
  const priority = searchParams.get('priority') || ''
  const source   = searchParams.get('source')   || ''

  const where: any = { ...buildLeadFilter(user) }
  if (search) where.OR = [
    { name:        { contains: search, mode: 'insensitive' } },
    { contactName: { contains: search, mode: 'insensitive' } },
    { email:       { contains: search, mode: 'insensitive' } },
  ]
  if (status)   where.status   = status
  if (priority) where.priority = priority
  if (source)   where.source   = source

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        team:       { select: { id: true, name: true } },
        createdBy:  { select: { id: true, name: true } },
        _count:     { select: { followUps: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ])

  return NextResponse.json({ data: leads, meta: { total, page, limit } })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_create_lead')
  if (pe) return pe

  try {
    const body = await req.json()
    const data = CreateSchema.parse(body)

    const lead = await prisma.lead.create({
      data: {
        name:           data.name,
        contactName:    data.contactName,
        email:          data.email || null,
        phone:          data.phone || null,
        city:           data.city  || null,
        source:         data.source,
        status:         data.status,
        priority:       data.priority,
        dealValue:      data.dealValue,
        notes:          data.notes || null,
        assignedToId:   data.assignedToId || null,
        teamId:         data.teamId       || null,
        companyId:      user.companyId,
        createdById:    user.id,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        team:       { select: { id: true, name: true } },
      },
    })

    await prisma.activity.create({
      data: { userId: user.id, companyId: user.companyId, leadId: lead.id, action: 'Lead Created', module: 'Leads', recordName: lead.name },
    })

    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
