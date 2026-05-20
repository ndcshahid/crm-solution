'use client'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { PermGuard, usePermission } from '@/components/ui/PermGuard'
import { PageLoading, EmptyState } from '@/components/ui/Loading'
import toast from 'react-hot-toast'

export default function TeamsPage() {
  const [teams,   setTeams]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editTeam,setEditTeam]= useState<any>(null)
  const [delTeam, setDelTeam] = useState<any>(null)
  const [form,    setForm]    = useState({ name: '', managerId: '' })
  const [saving,  setSaving]  = useState(false)
  const [managers,setManagers]= useState<any[]>([])

  const canManage = usePermission('can_manage_teams')

  const load = () => {
    setLoading(true)
    fetch('/api/teams').then(r => r.json()).then(d => { setTeams(d.data || []); setLoading(false) })
  }

  useEffect(() => {
    load()
    fetch('/api/users?limit=100').then(r => r.json()).then(d => {
      setManagers((d.data || []).filter((u: any) => ['admin','sales_manager'].includes(u.role?.name)))
    })
  }, [])

  const openCreate = () => { setEditTeam(null); setForm({ name: '', managerId: '' }); setModal(true) }
  const openEdit   = (t: any) => { setEditTeam(t); setForm({ name: t.name, managerId: t.manager?.id || '' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name) { toast.error('Team name required'); return }
    setSaving(true)
    const method = editTeam ? 'PUT' : 'POST'
    const url    = editTeam ? `/api/teams/${editTeam.id}` : '/api/teams'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (r.ok) { toast.success(editTeam ? 'Team updated' : 'Team created'); setModal(false); load() }
    else { const d = await r.json(); toast.error(d.error || 'Failed') }
  }

  const handleDelete = async () => {
    const r = await fetch(`/api/teams/${delTeam.id}`, { method: 'DELETE' })
    if (r.ok) { toast.success('Team deleted'); setDelTeam(null); load() }
    else toast.error('Failed to delete team')
  }

  return (
    <div className="page-container">
      <Topbar title="Teams" actions={
        canManage ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Create Team
          </button>
        ) : undefined
      } />

      <div className="page-content">
        {loading ? <PageLoading /> : teams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            description="Create teams to organize your sales executives."
            action={canManage ? <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Create Team</button> : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {teams.map(team => (
              <div key={team.id} className="card p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{team.name}</h3>
                    {team.manager && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar name={team.manager.name} size="xs" />
                        <span className="text-xs text-slate-500">Manager: {team.manager.name}</span>
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => openEdit(team)} title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setDelTeam(team)} title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-4 py-3 border-y border-slate-100">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-slate-900">{team.members?.length || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Members</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-blue-700">{team._count?.leads || 0}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Leads</div>
                  </div>
                </div>

                {/* Members */}
                {team.members?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Members</p>
                    {team.members.map((m: any) => (
                      <div key={m.userId} className="flex items-center gap-2.5">
                        <Avatar name={m.user.name} size="xs" />
                        <span className="text-sm text-slate-700 flex-1">{m.user.name}</span>
                        <RoleBadge role={m.user.role?.name || ''} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No members yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTeam ? 'Edit Team' : 'Create Team'} size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editTeam ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Team Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Team Alpha" />
          </div>
          <div>
            <label className="label">Manager</label>
            <select className="input" value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}>
              <option value="">— No manager —</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role?.label})</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTeam}
        title="Delete Team"
        message={`Delete "${delTeam?.name}"? Members will not be deleted but will no longer be part of this team.`}
        confirmLabel="Delete Team"
        onConfirm={handleDelete}
        onCancel={() => setDelTeam(null)}
      />
    </div>
  )
}
