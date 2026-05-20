import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission, buildLeadFilter } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req)
  if (error) return error
  const pe = requirePermission(user, 'can_view_reports')
  if (pe) return pe

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'overview'
  const lf   = buildLeadFilter(user)

  if (type === 'pipeline') {
    const rows = await prisma.lead.groupBy({
      by: ['status'], where: lf,
      _count: true, _sum: { dealValue: true },
    })
    return NextResponse.json({ data: rows.map(r => ({ status: r.status, count: r._count, value: r._sum.dealValue || 0 })) })
  }

  if (type === 'source') {
    const rows = await prisma.lead.groupBy({
      by: ['source'], where: lf,
      _count: true, _sum: { dealValue: true },
    })
    return NextResponse.json({ data: rows.map(r => ({ source: r.source, count: r._count, value: r._sum.dealValue || 0 })) })
  }

  if (type === 'performance') {
    const execs = await prisma.user.findMany({
      where: { companyId: user.companyId, role: { name: 'sales_executive' } },
      include: {
        assignedLeads: { where: lf.companyId ? { companyId: lf.companyId } : {}, select: { status: true, dealValue: true } },
      },
    })
    const data = execs.map(e => ({
      id:   e.id,
      name: e.name,
      total:  e.assignedLeads.length,
      won:    e.assignedLeads.filter(l => l.status === 'Won').length,
      lost:   e.assignedLeads.filter(l => l.status === 'Lost').length,
      active: e.assignedLeads.filter(l => !['Won','Lost'].includes(l.status)).length,
      value:  e.assignedLeads.reduce((s, l) => s + l.dealValue, 0),
    }))
    return NextResponse.json({ data })
  }

  // overview
  const [total, won, lost, active, pipelineAgg] = await Promise.all([
    prisma.lead.count({ where: lf }),
    prisma.lead.count({ where: { ...lf, status: 'Won' } }),
    prisma.lead.count({ where: { ...lf, status: 'Lost' } }),
    prisma.lead.count({ where: { ...lf, status: { notIn: ['Won','Lost'] } } }),
    prisma.lead.aggregate({ where: { ...lf, status: { notIn: ['Won','Lost'] } }, _sum: { dealValue: true } }),
  ])
  return NextResponse.json({ data: { total, won, lost, active, pipelineValue: pipelineAgg._sum.dealValue || 0, conversionRate: total > 0 ? Math.round(won / total * 100) : 0 } })
}
