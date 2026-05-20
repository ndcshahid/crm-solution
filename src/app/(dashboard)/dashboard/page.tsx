'use client'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { PageLoading } from '@/components/ui/Loading'
import { useCurrentUser } from '@/components/ui/PermGuard'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts'

const STATUS_PIE_COLORS: Record<string, string> = {
  New: '#3b82f6', Contacted: '#f59e0b', Qualified: '#10b981',
  'Proposal Sent': '#8b5cf6', Won: '#059669', Lost: '#ef4444',
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-2xl font-bold mb-1`} style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const user = useCurrentUser()
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-container">
      <Topbar title="Dashboard" />
      <PageLoading />
    </div>
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const pieData = (data?.leadsByStatus || []).map((s: any) => ({
    name: s.status, value: s.count, fill: STATUS_PIE_COLORS[s.status] || '#94a3b8',
  }))

  const barData = data?.monthlyLeads || []

  return (
    <div className="page-container">
      <Topbar title="Dashboard" />
      <div className="page-content space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Alert banners */}
        {(data?.overdueFollowUps > 0 || data?.todayFollowUps > 0) && (
          <div className="flex flex-wrap gap-3">
            {data?.overdueFollowUps > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {data.overdueFollowUps} overdue follow-up{data.overdueFollowUps !== 1 ? 's' : ''}
              </div>
            )}
            {data?.todayFollowUps > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                {data.todayFollowUps} follow-up{data.todayFollowUps !== 1 ? 's' : ''} due today
              </div>
            )}
            {data?.todayAppointments > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                {data.todayAppointments} appointment{data.todayAppointments !== 1 ? 's' : ''} today
              </div>
            )}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Leads"    value={String(data?.totalLeads || 0)}               sub={`${data?.newLeads || 0} new`}              color="#2563eb" />
          <StatCard label="Pipeline Value" value={formatCurrency(data?.pipelineValue || 0)}    sub="Active opportunities"                      color="#7c3aed" />
          <StatCard label="Won Deals"      value={String(data?.wonDeals || 0)}                  sub={`${data?.conversionRate || 0}% conversion`} color="#059669" />
          <StatCard label="Lost Deals"     value={String(data?.lostDeals || 0)}                 sub="Needs follow-up"                           color="#dc2626" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Monthly bar chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Monthly Leads</h3>
              <span className="text-xs text-slate-400">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((_: any, i: number) => (
                    <Cell key={i} fill={i === barData.length - 1 ? '#2563eb' : '#bfdbfe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status donut */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Leads by Status</h3>
              <span className="text-xs text-slate-400">{data?.totalLeads || 0} total</span>
            </div>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={130} height={130}>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, '']} />
                </PieChart>
                <div className="flex flex-col gap-1.5 flex-1">
                  {pieData.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.fill }} />
                        <span className="text-xs text-slate-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {(data?.recentActivities || []).length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">No activity yet.</p>
            )}
            {(data?.recentActivities || []).map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  a.action.includes('Created') ? 'bg-blue-500' :
                  a.action.includes('Won') || a.action.includes('Completed') ? 'bg-green-500' :
                  a.action.includes('Deleted') ? 'bg-red-500' : 'bg-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{a.user?.name}</span>
                    {' — '}{a.action}
                    {a.recordName && <span className="text-slate-500">: {a.recordName}</span>}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
