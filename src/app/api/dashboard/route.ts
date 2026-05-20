import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, buildLeadFilter } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error

  const lf = buildLeadFilter(user)
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const fuScope: any = user.role.name === 'sales_executive' ? { userId: user.id } : {}

  const [
    totalLeads, newLeads, wonLeads, lostLeads,
    pipelineAgg,
    todayFU, overdueFU,
    todayAppts,
    byStatus, bySource,
    recentActivities,
  ] = await Promise.all([
    prisma.lead.count({ where: lf }),
    prisma.lead.count({ where: { ...lf, status: 'New' } }),
    prisma.lead.count({ where: { ...lf, status: 'Won' } }),
    prisma.lead.count({ where: { ...lf, status: 'Lost' } }),
    prisma.lead.aggregate({ where: { ...lf, status: { notIn: ['Won', 'Lost'] } }, _sum: { dealValue: true } }),
    prisma.followUp.count({ where: { ...fuScope, scheduledAt: { gte: today, lt: tomorrow }, status: 'Pending' } }),
    prisma.followUp.count({ where: { ...fuScope, scheduledAt: { lt: today }, status: 'Pending' } }),
    prisma.appointment.count({ where: { ...fuScope, scheduledAt: { gte: today, lt: tomorrow }, status: 'Scheduled' } }),
    prisma.lead.groupBy({ by: ['status'],  where: lf, _count: true }),
    prisma.lead.groupBy({ by: ['source'],  where: lf, _count: true, _sum: { dealValue: true } }),
    prisma.activity.findMany({
      where: { companyId: user.companyId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  // Monthly trend — last 6 months
  const months: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = await prisma.lead.count({ where: { ...lf, createdAt: { gte: d, lt: end } } })
    months.push({ month: d.toLocaleString('default', { month: 'short' }), count })
  }

  return NextResponse.json({
    data: {
      totalLeads,
      newLeads,
      wonDeals:       wonLeads,
      lostDeals:      lostLeads,
      pipelineValue:  pipelineAgg._sum.dealValue || 0,
      todayFollowUps: todayFU,
      overdueFollowUps: overdueFU,
      todayAppointments: todayAppts,
      conversionRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
      leadsByStatus:  byStatus.map(s => ({ status: s.status,  count: s._count })),
      leadsBySource:  bySource.map(s => ({ source: s.source,  count: s._count, value: s._sum.dealValue || 0 })),
      monthlyLeads:   months,
      recentActivities,
    },
  })
}
