'use client'
import { useEffect, useState, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PermGuard } from '@/components/ui/PermGuard'
import { PageLoading, EmptyState } from '@/components/ui/Loading'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'today',    label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue',  label: 'Overdue' },
  { id: 'all',      label: 'All' },
]

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('today')
  const [showAdd,   setShowAdd]   = useState(false)
  const [leads,     setLeads]     = useState<any[]>([])
  const [addForm,   setAddForm]   = useState({ leadId: '', scheduledAt: '', note: '' })
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/follow-ups?filter=${tab}`)
      .then(r => r.json())
      .then(d => { setFollowUps(d.data || []); setLoading(false) })
  }, [tab])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/leads?limit=200').then(r => r.json()).then(d => setLeads(d.data || []))
  }, [])

  const markComplete = async (id: string) => {
    const r = await fetch(`/api/follow-ups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Completed' }) })
    if (r.ok) { toast.success('Marked complete!'); load() }
    else toast.error('Failed to update')
  }

  const markMissed = async (id: string) => {
    const r = await fetch(`/api/follow-ups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Missed' }) })
    if (r.ok) { toast.success('Marked as missed'); load() }
  }

  const handleAdd = async () => {
    if (!addForm.leadId || !addForm.scheduledAt) { toast.error('Select lead and date/time'); return }
    setSaving(true)
    const r = await fetch('/api/follow-ups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) })
    setSaving(false)
    if (r.ok) { toast.success('Follow-up added!'); setShowAdd(false); setAddForm({ leadId: '', scheduledAt: '', note: '' }); load() }
    else toast.error('Failed to add follow-up')
  }

  const rowBg = (f: any) => {
    if (f.status === 'Completed') return 'bg-green-50/50'
    if (f.status === 'Missed')    return 'bg-red-50/50'
    const isOverdue = new Date(f.scheduledAt) < new Date() && f.status === 'Pending'
    if (isOverdue)                return 'bg-orange-50/50'
    return ''
  }

  return (
    <div className="page-container">
      <Topbar title="Follow Ups" actions={
        <PermGuard permission="can_add_follow_up">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Follow-Up
          </button>
        </PermGuard>
      } />

      <div className="page-content space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setLoading(true) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? <PageLoading /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Lead</th>
                    <th className="th">Assigned To</th>
                    <th className="th">Scheduled</th>
                    <th className="th">Note</th>
                    <th className="th">Status</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.length === 0 ? (
                    <tr><td colSpan={6}>
                      <EmptyState title={tab === 'today' ? 'No follow-ups today' : tab === 'overdue' ? 'No overdue follow-ups 🎉' : 'No follow-ups found'} description="All caught up!" />
                    </td></tr>
                  ) : followUps.map(f => (
                    <tr key={f.id} className={`transition-colors ${rowBg(f)}`}>
                      <td className="td font-medium text-slate-900">{f.lead?.name}</td>
                      <td className="td text-slate-600">{f.user?.name}</td>
                      <td className="td">
                        <span className="text-sm font-medium">{formatDateTime(f.scheduledAt)}</span>
                        {new Date(f.scheduledAt) < new Date() && f.status === 'Pending' && (
                          <span className="ml-2 text-xs text-red-600 font-semibold">OVERDUE</span>
                        )}
                      </td>
                      <td className="td max-w-xs">
                        <span className="text-sm text-slate-600 line-clamp-2">{f.note || '—'}</span>
                      </td>
                      <td className="td"><StatusBadge status={f.status} /></td>
                      <td className="td">
                        {f.status === 'Pending' && (
                          <PermGuard permission="can_add_follow_up">
                            <div className="flex gap-1.5">
                              <button className="btn btn-success btn-sm" onClick={() => markComplete(f.id)}>✓ Done</button>
                              <button className="btn btn-danger btn-sm"  onClick={() => markMissed(f.id)}>Missed</button>
                            </div>
                          </PermGuard>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add follow-up modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Follow-Up"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Lead <span className="text-red-500">*</span></label>
            <select className="input" value={addForm.leadId} onChange={e => setAddForm(p => ({ ...p, leadId: e.target.value }))}>
              <option value="">— Select a lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.contactName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date & Time <span className="text-red-500">*</span></label>
            <input className="input" type="datetime-local" value={addForm.scheduledAt} onChange={e => setAddForm(p => ({ ...p, scheduledAt: e.target.value }))} />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input" rows={3} value={addForm.note} onChange={e => setAddForm(p => ({ ...p, note: e.target.value }))} placeholder="What needs to happen…" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
