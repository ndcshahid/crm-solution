'use client'
import { useEffect, useState, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { PermGuard, usePermission } from '@/components/ui/PermGuard'
import { PageLoading, EmptyState } from '@/components/ui/Loading'
import { formatCurrency, formatDate, LEAD_STATUSES, LEAD_PRIORITIES, LEAD_SOURCES } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name: '', contactName: '', email: '', phone: '', city: '',
  source: 'Website', status: 'New', priority: 'Medium',
  dealValue: 0, notes: '', assignedToId: '', teamId: '', nextFollowUpAt: '',
}

export default function LeadsPage() {
  const [leads,     setLeads]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [priorityF, setPriorityF] = useState('')
  const [modal,     setModal]     = useState(false)
  const [editLead,  setEditLead]  = useState<any>(null)
  const [viewLead,  setViewLead]  = useState<any>(null)
  const [delLead,   setDelLead]   = useState<any>(null)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })
  const [saving,    setSaving]    = useState(false)
  const [users,     setUsers]     = useState<any[]>([])
  const [teams,     setTeams]     = useState<any[]>([])

  const canEdit   = usePermission('can_edit_lead')
  const canDelete = usePermission('can_delete_lead')
  const canCreate = usePermission('can_create_lead')

  const LIMIT = 15

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (search)   p.set('search',   search)
    if (statusF)  p.set('status',   statusF)
    if (priorityF) p.set('priority', priorityF)
    const r = await fetch(`/api/leads?${p}`)
    const d = await r.json()
    setLeads(d.data || [])
    setTotal(d.meta?.total || 0)
    setLoading(false)
  }, [page, search, statusF, priorityF])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/users?limit=100').then(r => r.json()).then(d => setUsers(d.data || []))
    fetch('/api/teams').then(r => r.json()).then(d => setTeams(d.data || []))
  }, [])

  const openCreate = () => { setEditLead(null); setForm({ ...EMPTY_FORM }); setModal(true) }
  const openEdit   = (l: any) => {
    setEditLead(l)
    setForm({
      name: l.name, contactName: l.contactName, email: l.email || '', phone: l.phone || '',
      city: l.city || '', source: l.source, status: l.status, priority: l.priority,
      dealValue: l.dealValue, notes: l.notes || '',
      assignedToId: l.assignedToId || '', teamId: l.teamId || '',
      nextFollowUpAt: l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toISOString().split('T')[0] : '',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.contactName) { toast.error('Name and contact are required'); return }
    setSaving(true)
    const method = editLead ? 'PUT' : 'POST'
    const url    = editLead ? `/api/leads/${editLead.id}` : '/api/leads'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, dealValue: Number(form.dealValue) }) })
    setSaving(false)
    if (r.ok) {
      toast.success(editLead ? 'Lead updated' : 'Lead created')
      setModal(false); load()
    } else {
      const d = await r.json()
      toast.error(d.error || 'Failed to save lead')
    }
  }

  const handleDelete = async () => {
    const r = await fetch(`/api/leads/${delLead.id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Lead deleted'); setDelLead(null); load() }
    else toast.error('Failed to delete')
  }

  const pages = Math.ceil(total / LIMIT)

  const F = ({ label, field, type = 'text', opts, required = false }: any) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {opts ? (
        <select className="input" value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}>
          {!required && <option value="">— Select —</option>}
          {opts.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : (
        <input className="input" type={type} value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
      )}
    </div>
  )

  return (
    <div className="page-container">
      <Topbar
        title={`Leads${total > 0 ? ` (${total})` : ''}`}
        actions={
          <PermGuard permission="can_create_lead">
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Lead
            </button>
          </PermGuard>
        }
      />
      <div className="page-content space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input pl-8 w-52" placeholder="Search leads…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input w-40" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input w-40" value={priorityF} onChange={e => { setPriorityF(e.target.value); setPage(1) }}>
            <option value="">All Priorities</option>
            {LEAD_PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          {(search || statusF || priorityF) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setStatusF(''); setPriorityF(''); setPage(1) }}>
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? <PageLoading /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">Lead / Contact</th>
                      <th className="th">Status</th>
                      <th className="th">Priority</th>
                      <th className="th">Source</th>
                      <th className="th">Assigned To</th>
                      <th className="th">Deal Value</th>
                      <th className="th">Next Follow-Up</th>
                      <th className="th w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr><td colSpan={8}>
                        <EmptyState
                          title="No leads found"
                          description={search || statusF ? 'Try adjusting your filters.' : 'Create your first lead to get started.'}
                          action={canCreate ? <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Lead</button> : undefined}
                        />
                      </td></tr>
                    ) : leads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="td">
                          <div className="font-semibold text-slate-900 text-sm">{l.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{l.contactName}{l.city ? ` · ${l.city}` : ''}</div>
                        </td>
                        <td className="td"><StatusBadge status={l.status} /></td>
                        <td className="td"><PriorityBadge priority={l.priority} /></td>
                        <td className="td"><span className="text-xs text-slate-500">{l.source}</span></td>
                        <td className="td">
                          {l.assignedTo
                            ? <div className="flex items-center gap-1.5"><Avatar name={l.assignedTo.name} size="xs" /><span className="text-xs">{l.assignedTo.name}</span></div>
                            : <span className="text-xs text-slate-400">Unassigned</span>
                          }
                        </td>
                        <td className="td"><span className="font-semibold text-slate-900">{formatCurrency(l.dealValue)}</span></td>
                        <td className="td"><span className="text-xs text-slate-500">{formatDate(l.nextFollowUpAt)}</span></td>
                        <td className="td">
                          <div className="flex items-center gap-0.5">
                            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="View" onClick={() => setViewLead(l)}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            {canEdit && (
                              <button className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit" onClick={() => openEdit(l)}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            )}
                            {canDelete && (
                              <button className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete" onClick={() => setDelLead(l)}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                      const n = Math.max(1, Math.min(page - 2, pages - 4)) + i
                      return (
                        <button key={n} className={`btn btn-sm min-w-[32px] ${n === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(n)}>{n}</button>
                      )
                    })}
                    <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editLead ? 'Edit Lead' : 'Add New Lead'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editLead ? 'Update Lead' : 'Create Lead'}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <F label="Company / Lead Name" field="name"        required />
          <F label="Contact Person"      field="contactName" required />
          <F label="Email"               field="email"       type="email" />
          <F label="Phone"               field="phone" />
          <F label="City"                field="city" />
          <F label="Source"              field="source"   opts={LEAD_SOURCES}   required />
          <F label="Status"              field="status"   opts={LEAD_STATUSES}  required />
          <F label="Priority"            field="priority" opts={LEAD_PRIORITIES} required />
          <F label="Deal Value ($)"      field="dealValue" type="number" />
          <F label="Next Follow-Up Date" field="nextFollowUpAt" type="date" />
          <F label="Assign To"  field="assignedToId" opts={users.map((u: any) => ({ value: u.id, label: u.name }))} />
          <F label="Team"       field="teamId"       opts={teams.map((t: any) => ({ value: t.id, label: t.name }))} />
        </div>
        <div className="mt-4">
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes…" />
        </div>
      </Modal>

      {/* View Modal */}
      {viewLead && (
        <Modal open title={viewLead.name} onClose={() => setViewLead(null)} size="lg"
          footer={<>
            {canEdit && <button className="btn btn-primary btn-sm" onClick={() => { setViewLead(null); openEdit(viewLead) }}>Edit Lead</button>}
            <button className="btn btn-secondary" onClick={() => setViewLead(null)}>Close</button>
          </>}
        >
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={viewLead.status} />
              <PriorityBadge priority={viewLead.priority} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Contact',    value: viewLead.contactName },
                { label: 'Email',      value: viewLead.email || '—' },
                { label: 'Phone',      value: viewLead.phone || '—' },
                { label: 'City',       value: viewLead.city  || '—' },
                { label: 'Source',     value: viewLead.source },
                { label: 'Deal Value', value: formatCurrency(viewLead.dealValue) },
                { label: 'Assigned To', value: viewLead.assignedTo?.name || 'Unassigned' },
                { label: 'Next Follow-Up', value: formatDate(viewLead.nextFollowUpAt) },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-lg px-4 py-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="text-sm font-medium text-slate-800">{f.value}</div>
                </div>
              ))}
            </div>
            {viewLead.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Notes</div>
                <p className="text-sm text-amber-800 leading-relaxed">{viewLead.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!delLead}
        title="Delete Lead"
        message={`Delete "${delLead?.name}"? This will also remove all follow-ups and appointments. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDelLead(null)}
      />
    </div>
  )
}
