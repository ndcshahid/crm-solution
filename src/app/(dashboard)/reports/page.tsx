'use client'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { PageLoading } from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip, Legend } from 'recharts'

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'pipeline',     label: 'Pipeline' },
  { id: 'source',       label: 'By Source' },
  { id: 'performance',  label: 'Team Performance' },
]

const COLORS = ['#2563eb','#0891b2','#059669','#7c3aed','#d97706','#dc2626','#db2777','#0284c7']
const STATUS_COLORS: Record<string, string> = { New:'#3b82f6', Contacted:'#f59e0b', Qualified:'#10b981', 'Proposal Sent':'#8b5cf6', Won:'#059669', Lost:'#ef4444' }

export default function ReportsPage() {
  const [tab,     setTab]     = useState('overview')
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?type=${tab}`)
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  return (
    <div className="page-container">
      <Topbar title="Reports & Analytics" />
      <div className="page-content space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <PageLoading /> : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && data && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Leads',      value: data.total,                      color: 'text-slate-900' },
                    { label: 'Active Leads',      value: data.active,                     color: 'text-blue-700' },
                    { label: 'Won Deals',         value: data.won,                        color: 'text-green-700' },
                    { label: 'Lost Deals',        value: data.lost,                       color: 'text-red-600' },
                    { label: 'Pipeline Value',    value: formatCurrency(data.pipelineValue), color: 'text-purple-700' },
                    { label: 'Conversion Rate',   value: `${data.conversionRate}%`,       color: 'text-emerald-700' },
                  ].map(s => (
                    <div key={s.label} className="card p-5">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{s.label}</div>
                      <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PIPELINE */}
            {tab === 'pipeline' && Array.isArray(data) && (
              <div className="card p-6">
                <h3 className="font-semibold text-slate-900 mb-5">Pipeline by Stage</h3>
                <div className="space-y-4">
                  {data.map((row: any) => {
                    const maxVal = Math.max(...data.map((r: any) => r.value))
                    const pct = maxVal > 0 ? (row.value / maxVal) * 100 : 0
                    return (
                      <div key={row.status}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-medium text-slate-700">{row.status}</span>
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span><strong className="text-slate-900">{row.count}</strong> leads</span>
                            <span><strong className="text-slate-900">{formatCurrency(row.value)}</strong></span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: STATUS_COLORS[row.status] || '#94a3b8' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {data.length > 0 && (
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data} margin={{ left: -20, right: 0 }}>
                        <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Value']} />
                        <Bar dataKey="value" radius={[4,4,0,0]}>
                          {data.map((r: any, i: number) => <Cell key={i} fill={STATUS_COLORS[r.status] || COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* SOURCE */}
            {tab === 'source' && Array.isArray(data) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-900 mb-5">Leads by Source</h3>
                  <div className="space-y-3">
                    {data.sort((a: any, b: any) => b.count - a.count).map((row: any, i: number) => {
                      const max = Math.max(...data.map((r: any) => r.count))
                      return (
                        <div key={row.source}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{row.source}</span>
                            <span className="text-xs text-slate-500"><strong>{row.count}</strong> leads · {formatCurrency(row.value)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Source Distribution</h3>
                  <PieChart width={300} height={220}>
                    <Pie data={data} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} label={({ source, count }: any) => `${source} (${count})`}>
                      {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
              </div>
            )}

            {/* PERFORMANCE */}
            {tab === 'performance' && Array.isArray(data) && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Sales Executive Performance</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">Executive</th>
                      <th className="th text-right">Total</th>
                      <th className="th text-right">Won</th>
                      <th className="th text-right">Lost</th>
                      <th className="th text-right">Active</th>
                      <th className="th text-right">Pipeline</th>
                      <th className="th text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">No data available</td></tr>
                    ) : data.sort((a: any, b: any) => b.won - a.won).map((exec: any) => (
                      <tr key={exec.id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-900">{exec.name}</td>
                        <td className="td text-right">{exec.total}</td>
                        <td className="td text-right">
                          <span className="text-green-700 font-semibold">{exec.won}</span>
                        </td>
                        <td className="td text-right">
                          <span className="text-red-600 font-semibold">{exec.lost}</span>
                        </td>
                        <td className="td text-right text-blue-700">{exec.active}</td>
                        <td className="td text-right font-semibold">{formatCurrency(exec.value)}</td>
                        <td className="td text-right">
                          <span className={`font-semibold ${exec.total > 0 && exec.won / exec.total >= 0.3 ? 'text-green-700' : 'text-slate-600'}`}>
                            {exec.total > 0 ? Math.round((exec.won / exec.total) * 100) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
