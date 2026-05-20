'use client'
import { useEffect, useState, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge, RoleBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { PermGuard, usePermission } from '@/components/ui/PermGuard'
import { PageLoading, EmptyState } from '@/components/ui/Loading'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY = { name: '', email: '', password: '', phone: '', roleId: '', departmentId: '', managerId: '', teamId: '' }

export default function UsersPage() {
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(false)
  const [editUser,setEditUser]= useState<any>(null)
  const [delUser, setDelUser] = useState<any>(null)
  const [form,    setForm]    = useState({ ...EMPTY })
  const [saving,  setSaving]  = useState(false)
  const [roles,   setRoles]   = useState<any[]>([])
  const [teams,   setTeams]   = useState<any[]>([])
  const [allUsers,setAllUsers]= useState<any[]>([])

  const canCreate     = usePermission('can_create_user')
  const canEdit       = usePermission('can_edit_user')
  const canDeactivate = usePermission('can_deactivate_user')

  const LIMIT = 15

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (search) p.set('search', search)
    const r = await fetch(`/api/users?${p}`)
    const d = await r.json()
    setUsers(d.data || [])
    setTotal(d.meta?.total || 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    // Load supporting data for form dropdowns
    fetch('/api/settings').then(r => r.json()).then(d => setRoles(d.data?.roles || []))
    fetch('/api/teams').then(r => r.json()).then(d => setTeams(d.data || []))
    fetch('/api/users?limit=100').then(r => r.json()).then(d => setAllUsers(d.data || []))
  }, [])

  const openCreate = () => { setEditUser(null); setForm({ ...EMPTY }); setModal(true) }
  const openEdit   = (u: any) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', roleId: u.role?.id || '', departmentId: u.departmentId || '', managerId: u.managerId || '', teamId: u.teams?.[0]?.team?.id || '' })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return }
    if (!editUser && !form.password) { toast.error('Password required for new users'); return }
    if (!form.roleId) { toast.error('Role required'); return }
    setSaving(true)
    const method = editUser ? 'PUT' : 'POST'
    const url    = editUser ? `/api/users/${editUser.id}` : '/api/users'
    const body   = editUser ? { ...form, password: form.password || undefined } : form
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (r.ok) { toast.success(editUser ? 'User updated' : 'User created'); setModal(false); load() }
    else { const d = await r.json(); toast.error(d.error || 'Failed') }
  }

  const toggleStatus = async (u: any) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active'
    const r = await fetch(`/api/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    if (r.ok) { toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`); load() }
    else toast.error('Failed to update status')
  }

  const pages = Math.ceil(total / LIMIT)
  const F = ({ label, field, type = 'text', opts, required = false, placeholder = '' }: any) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {opts ? (
        <select className="input" value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}>
          <option value="">— Select —</option>
          {opts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input className="input" type={type} value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} />
      )}
    </div>
  )

  return (
    <div className="page-container">
      <Topbar title={`Users${total > 0 ? ` (${total})` : ''}`} actions={
        canCreate ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add User
          </button>
        ) : undefined
      } />

      <div className="page-content space-y-4">
        <div className="flex gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input pl-8 w-52" placeholder="Search users…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          {search && <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setPage(1) }}>Clear</button>}
        </div>

        <div className="card overflow-hidden">
          {loading ? <PageLoading /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="th">User</th>
                      <th className="th">Role</th>
                      <th className="th">Department</th>
                      <th className="th">Leads</th>
                      <th className="th">Last Login</th>
                      <th className="th">Status</th>
                      <th className="th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={7}>
                        <EmptyState title="No users found" description={search ? 'Try a different search.' : 'Add your first user.'} action={canCreate ? <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add User</button> : undefined} />
                      </td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} size="sm" />
                            <div>
                              <div className="font-medium text-slate-900 text-sm">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="td"><RoleBadge role={u.role?.name || ''} /></td>
                        <td className="td"><span className="text-sm text-slate-500">{u.department?.name || '—'}</span></td>
                        <td className="td"><span className="text-sm text-slate-700 font-medium">{u._count?.assignedLeads ?? 0}</span></td>
                        <td className="td"><span className="text-xs text-slate-400">{formatDate(u.lastLoginAt)}</span></td>
                        <td className="td"><StatusBadge status={u.status} /></td>
                        <td className="td">
                          <div className="flex gap-1">
                            {canEdit && (
                              <button className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit" onClick={() => openEdit(u)}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            )}
                            {canDeactivate && (
                              <button
                                className={`p-1.5 rounded transition-colors ${u.status === 'active' ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-green-50 text-slate-400 hover:text-green-600'}`}
                                title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                                onClick={() => toggleStatus(u)}
                              >
                                {u.status === 'active'
                                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                }
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>←</button>
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                      const n = Math.max(1, Math.min(page-2, pages-4)) + i
                      return <button key={n} className={`btn btn-sm min-w-[32px] ${n===page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(n)}>{n}</button>
                    })}
                    <button className="btn btn-secondary btn-sm" disabled={page===pages} onClick={() => setPage(p=>p+1)}>→</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editUser ? 'Edit User' : 'Create User'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editUser ? 'Update User' : 'Create User'}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <F label="Full Name"   field="name"  required placeholder="John Smith" />
          <F label="Email"       field="email" type="email" required placeholder="john@company.com" />
          <F label={editUser ? 'New Password (leave blank to keep)' : 'Password'} field="password" type="password" required={!editUser} placeholder="Min. 8 characters" />
          <F label="Phone"       field="phone" placeholder="+1-555-0000" />
          <F label="Role"        field="roleId" required opts={roles.map((r: any) => ({ value: r.id, label: r.label }))} />
          <F label="Team"        field="teamId" opts={teams.map((t: any) => ({ value: t.id, label: t.name }))} />
          <F label="Manager"     field="managerId" opts={allUsers.filter((u: any) => ['admin','sales_manager'].includes(u.role?.name)).map((u: any) => ({ value: u.id, label: u.name }))} />
        </div>
      </Modal>
    </div>
  )
}
