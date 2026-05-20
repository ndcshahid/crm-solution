'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { PageLoading } from '@/components/ui/Loading'
import { formatDate, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ name: '', phone: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/users/${user.id}`)
      .then(r => r.json())
      .then(d => {
        setProfile(d.data)
        setForm(p => ({ ...p, name: d.data?.name || '', phone: d.data?.phone || '' }))
        setLoading(false)
      })
  }, [user?.id])

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return }
    if (form.newPassword && form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.newPassword && form.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    const body: any = { name: form.name, phone: form.phone }
    if (form.newPassword) body.password = form.newPassword
    const r = await fetch(`/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (r.ok) { toast.success('Profile updated!'); setForm(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' })) }
    else toast.error('Failed to update profile')
  }

  if (loading) return <div className="page-container"><Topbar title="Profile" /><PageLoading /></div>

  return (
    <div className="page-container">
      <Topbar title="My Profile" />
      <div className="page-content">
        <div className="max-w-2xl space-y-5">
          {/* Profile card */}
          <div className="card p-6">
            <div className="flex items-center gap-5 mb-6">
              <Avatar name={profile?.name || ''} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
                <p className="text-slate-500 text-sm">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <RoleBadge role={profile?.role?.name || ''} />
                  <StatusBadge status={profile?.status || 'active'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-5">
              {[
                { label: 'Company',    value: profile?.company?.name || '—' },
                { label: 'Department', value: profile?.department?.name || '—' },
                { label: 'Manager',    value: profile?.manager?.name || '—' },
                { label: 'Member Since', value: formatDate(profile?.createdAt) },
                { label: 'Last Login', value: formatDateTime(profile?.lastLoginAt) },
                { label: 'Phone',      value: profile?.phone || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                  <p className="text-sm text-slate-800 font-medium">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Edit form */}
            <h3 className="font-semibold text-slate-900 mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1-555-0000" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-medium text-slate-700 mb-3 text-sm">Change Password <span className="text-slate-400 font-normal">(optional)</span></h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">New Password</label>
                    <input className="input" type="password" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 8 characters" />
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <input className="input" type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
