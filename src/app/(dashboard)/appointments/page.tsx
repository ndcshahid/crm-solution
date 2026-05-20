'use client'
import { useEffect, useState, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PermGuard, usePermission } from '@/components/ui/PermGuard'
import { PageLoading, EmptyState } from '@/components/ui/Loading'
import { formatDateTime, MEETING_TYPES } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['All', 'Scheduled', 'Completed', 'Cancelled', 'Missed']
const EMPTY = { leadId: '', scheduledAt: '', meetingType: 'Phone Call', location: '', notes: '' }

export default function AppointmentsPage() {
  const [appts,    setAppts]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [statusF,  setStatusF]  = useState('All')
  const [showAdd,  setShowAdd]  = useState(false)
  const [editAppt, setEditAppt] = useState<any>(null)
  const [form,     setForm]     = useState({ ...EMPTY })
  const [saving,   setSaving]   = useState(false)
  const [leads,    setLeads]    = useState<any[]>([])

  const canCreate = usePermission('can_create_appointment')
  const canEdit   = usePermission('can_edit_appointment')

  const load = useCallback(() => {
    setLoading(true)
    const p = statusF !== 'All' ? `?status=${statusF}` : ''
    fetch(`/api/appointments${p}`)
      .then(r => r.json())
      .then(d => { setAppts(d.data || []); setLoading(false) })
  }, [statusF])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/leads?limit=200').then(r => r.json()).then(d => setLeads(d.data || []))
  }, [])

  const openCreate = () => { setEditAppt(null); setForm({ ...EMPTY }); setShowAdd(true) }
  const openEdit   = (a: any) => {
    setEditAppt(a)
    setForm({ leadId: a.leadId, scheduledAt: new Date(a.scheduledAt).toISOString().slice(0, 16), meetingType: a.meetingType, location: a.location || '', notes: a.notes || '' })
    setShowAdd(true)
  }

  const handleSave = async () => {
    if (!form.leadId || !form.scheduledAt) { toast.error('Lead and date/time required'); return }
    setSaving(true)
    const method = editAppt ? 'PUT' : 'POST'
    const url    = editAppt ? `/api/appointments/${editAppt.id}` : '/api/appointments'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (r.ok) { toast.success(editAppt ? 'Appointment updated' : 'Appointment created'); setShowAdd(false); load() }
    else toast.error('Failed to save')
  }

  const updateStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (r.ok) { toast.success(`Marked as ${status}`); load() }
    else toast.error('Failed to update')
  }

  const upcoming = appts.filter(a => a.status === 'Scheduled' && new Date(a.scheduledAt) >= new Date()).length
  const today    = appts.filter(a => {
    const d = new Date(a.scheduledAt); const t = new Date()
    return d.toDateString() === t.toDateString() && a.status === 'Scheduled'
  }).length

  return (
    <div className="page-container">
      <Topbar title="Appointments" actions={
        canCreate ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Appointment
          </button>
        ) : undefined
      } />

      <div className="page-content space-y-4">
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          {today > 0 && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-medium">{today} appointment{today !== 1 ? 's' : ''} today</div>}
          {upcoming > 0 && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-xs font-medium">{upcoming} upcoming</div>}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusF === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {s}
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
                    <th className="th">Type</th>
                    <th className="th">Date & Time</th>
                    <th className="th">Location</th>
                    <th className="th">Assigned To</th>
                    <th className="th">Status</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.length === 0 ? (
                    <tr><td colSpan={7}>
                      <EmptyState
                        title="No appointments found"
                        description={canCreate ? 'Schedule your first appointment to get started.' : 'No appointments yet.'}
                        action={canCreate ? <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Schedule</button> : undefined}
                      />
                    </td></tr>
                  ) : appts.map(a => {
                    const isPast = new Date(a.scheduledAt) < new Date()
                    return (
                      <tr key={a.id} className={`transition-colors hover:bg-slate-50 ${a.status === 'Completed' ? 'opacity-70' : ''}`}>
                        <td className="td">
                          <div className="font-medium text-slate-900">{a.lead?.name}</div>
                          <div className="text-xs text-slate-400">{a.lead?.contactName}</div>
                        </td>
                        <td className="td">
                          <span className="text-sm bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">{a.meetingType}</span>
                        </td>
                        <td className="td">
                          <span className={`text-sm font-medium ${isPast && a.status === 'Scheduled' ? 'text-red-600' : 'text-slate-900'}`}>
                            {formatDateTime(a.scheduledAt)}
                          </span>
                          {isPast && a.status === 'Scheduled' && <span className="ml-1 text-xs text-red-500">OVERDUE</span>}
                        </td>
                        <td className="td"><span className="text-sm text-slate-500">{a.location || '—'}</span></td>
                        <td className="td"><span className="text-sm text-slate-600">{a.user?.name}</span></td>
                        <td className="td"><StatusBadge status={a.status} /></td>
                        <td className="td">
                          <div className="flex gap-1.5">
                            {canEdit && a.status === 'Scheduled' && <>
                              <button className="btn btn-success btn-sm" onClick={() => updateStatus(a.id, 'Completed')}>✓ Done</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>Edit</button>
                            </>}
                            {a.status === 'Scheduled' && (
                              <PermGuard permission="can_edit_appointment">
                                <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a.id, 'Cancelled')}>Cancel</button>
                              </PermGuard>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editAppt ? 'Edit Appointment' : 'Schedule Appointment'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Lead <span className="text-red-500">*</span></label>
            <select className="input" value={form.leadId} onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))}>
              <option value="">— Select lead —</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.contactName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date & Time <span className="text-red-500">*</span></label>
              <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label className="label">Meeting Type</label>
              <select className="input" value={form.meetingType} onChange={e => setForm(p => ({ ...p, meetingType: e.target.value }))}>
                {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Location / Link</label>
            <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Office address or Zoom link…" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Agenda or preparation notes…" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
