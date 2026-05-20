'use client'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoading } from '@/components/ui/Loading'
import { usePermission } from '@/components/ui/PermGuard'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id: 'New',           label: 'New',           color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'Contacted',     label: 'Contacted',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'Qualified',     label: 'Qualified',     color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'Proposal Sent', label: 'Proposal Sent', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  { id: 'Won',           label: 'Won',           color: '#047857', bg: '#ecfdf5', border: '#6ee7b7' },
  { id: 'Lost',          label: 'Lost',          color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
]

export default function PipelinePage() {
  const [leads,   setLeads]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dragId,  setDragId]  = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)
  const canEdit = usePermission('can_edit_lead')

  useEffect(() => {
    fetch('/api/leads?limit=200')
      .then(r => r.json())
      .then(d => { setLeads(d.data || []); setLoading(false) })
  }, [])

  const handleDrop = async (newStatus: string) => {
    if (!canEdit || !dragId) return
    const lead = leads.find(l => l.id === dragId)
    if (!lead || lead.status === newStatus) { setDragId(null); setOverCol(null); return }

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === dragId ? { ...l, status: newStatus } : l))

    const r = await fetch(`/api/leads/${dragId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, status: newStatus }),
    })

    if (!r.ok) {
      setLeads(prev => prev.map(l => l.id === dragId ? { ...l, status: lead.status } : l))
      toast.error('Failed to update status')
    } else {
      toast.success(`Moved to ${newStatus}`)
    }
    setDragId(null); setOverCol(null)
  }

  const totalValue = leads.filter(l => !['Won','Lost'].includes(l.status)).reduce((s, l) => s + l.dealValue, 0)
  const wonValue   = leads.filter(l => l.status === 'Won').reduce((s, l) => s + l.dealValue, 0)

  if (loading) return <div className="page-container"><Topbar title="Pipeline" /><PageLoading /></div>

  return (
    <div className="page-container flex flex-col">
      <Topbar title="Sales Pipeline" actions={
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Pipeline: <strong className="text-blue-700">{formatCurrency(totalValue)}</strong></span>
          <span>Won: <strong className="text-green-700">{formatCurrency(wonValue)}</strong></span>
        </div>
      } />

      {!canEdit && (
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-lg text-sm">
          Read-only view — you don&apos;t have permission to move leads
        </div>
      )}

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: 'max-content', minHeight: '500px' }}>
          {COLUMNS.map(col => {
            const colLeads  = leads.filter(l => l.status === col.id)
            const colValue  = colLeads.reduce((s, l) => s + l.dealValue, 0)
            const isDragOver = overCol === col.id

            return (
              <div key={col.id} className="w-56 flex-shrink-0 flex flex-col"
                onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
                onDrop={() => handleDrop(col.id)}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null) }}
              >
                {/* Column header */}
                <div className="px-3 py-2.5 rounded-t-xl flex items-center justify-between font-semibold text-xs"
                  style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: col.color }}>
                  <span>{col.label}</span>
                  <span className="bg-black/10 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 rounded-b-xl p-2 space-y-2 overflow-y-auto transition-all duration-150"
                  style={{
                    background: isDragOver ? col.bg : '#f8fafc',
                    border: `1.5px solid ${isDragOver ? col.border : '#e2e8f0'}`,
                    borderTop: 'none',
                  }}>
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable={canEdit}
                      onDragStart={() => setDragId(lead.id)}
                      onDragEnd={() => { setDragId(null); setOverCol(null) }}
                      className={`bg-white rounded-lg p-3 border transition-all text-left w-full ${
                        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                      } ${dragId === lead.id ? 'opacity-40 scale-95' : 'hover:border-slate-300 hover:shadow-sm'} border-slate-200`}
                    >
                      <p className="font-semibold text-sm text-slate-900 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{lead.contactName}</p>
                      <p className="text-sm font-bold text-blue-700 mt-2">{formatCurrency(lead.dealValue)}</p>
                      <div className="flex items-center justify-between mt-2">
                        {lead.assignedTo
                          ? <div className="flex items-center gap-1"><Avatar name={lead.assignedTo.name} size="xs" /><span className="text-[11px] text-slate-500">{lead.assignedTo.name.split(' ')[0]}</span></div>
                          : <span className="text-[11px] text-slate-400">Unassigned</span>
                        }
                        {lead.nextFollowUpAt && (
                          <span className="text-[10px] text-slate-400">{formatDate(lead.nextFollowUpAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-slate-300">
                      {canEdit ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                  {colValue > 0 && (
                    <div className="text-center pt-1 text-[11px] font-semibold" style={{ color: col.color }}>
                      {formatCurrency(colValue)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
