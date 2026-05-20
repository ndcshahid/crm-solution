'use client'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { PageLoading, EmptyState } from '@/components/ui/Loading'
import { useRole } from '@/components/ui/PermGuard'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLANS = ['Starter', 'Professional', 'Enterprise']
const EMPTY = { name: '', email: '', phone: '', plan: 'Starter' }

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editCo,    setEditCo]    = useState<any>(null)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [saving,    setSaving]    = useState(false)

  const role = useRole()

  const load = () => {
    setLoading(true)
    fetch('/api/companies').then(r => r.json()).then(d => { setCompanies(d.data || []); setLoading(false) })
  }

  useEffect(() => { if (role === 'super_admin') load() }, [role])

  const openCreate = () => { setEditCo(null); setForm({ ...EMPTY }); setModal(true) }
  const openEdit   = (c: any) => { setEditCo(c); setForm({ name: c.name, email: c.email, phone: c.phone || '', plan: c.plan }); setModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return }
    setSaving(true)
    const method = editCo ? 'PUT' : 'POST'
    const url    = editCo ? `/api/companies/${editCo.id}` : '/api/companies'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (r.ok) { toast.success(editCo ? 'Company updated' : 'Company created'); setModal(false); load() }
    else { const d = await r.json(); toast.error(d.error || 'Failed') }
  }

  const toggleStatus = async (c: any) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active'
    const r = await fetch(`/api/companies/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    if (r.ok) { toast.success(`Company ${newStatus}`); load() }
  }

  if (role !== 'super_admin') {
    return (
      <div className="page-container">
        <Topbar title="Companies" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-3">🔒</div>
            <p className="font-semibold text-slate-700">Super Admin Only</p>
            <p className="text-sm text-slate-400 mt-1">You don&apos;t have access to this section.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Topbar title={`Companies (${companies.length})`} actions={
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Add Company
        </button>
      } />

      <div className="page-content">
        {loading ? <PageLoading /> : companies.length === 0 ? (
          <EmptyState title="No companies" description="Add your first company." action={<button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Company</button>} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Company</th>
                  <th className="th">Plan</th>
                  <th className="th">Users</th>
                  <th className="th">Leads</th>
                  <th className="th">Created</th>
                  <th className="th">Status</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="td">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                      {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                    </td>
                    <td className="td">
                      <span className={`badge ${c.plan === 'Enterprise' ? 'bg-amber-100 text-amber-800' : c.plan === 'Professional' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="td"><span className="font-semibold text-slate-900">{c._count?.users || 0}</span></td>
                    <td className="td"><span className="font-semibold text-slate-900">{c._count?.leads || 0}</span></td>
                    <td className="td"><span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span></td>
                    <td className="td"><StatusBadge status={c.status} /></td>
                    <td className="td">
                      <div className="flex gap-1.5">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button
                          className={`btn btn-sm ${c.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleStatus(c)}
                        >
                          {c.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editCo ? 'Edit Company' : 'Add Company'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editCo ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Company Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Corp" />
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@company.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1-555-0000" />
          </div>
          <div>
            <label className="label">Plan</label>
            <select className="input" value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}>
              {PLANS.map(pl => <option key={pl}>{pl}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
