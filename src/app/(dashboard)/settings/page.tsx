'use client'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { PageLoading } from '@/components/ui/Loading'
import { usePermission } from '@/components/ui/PermGuard'
import toast from 'react-hot-toast'

const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'SGD', 'AUD', 'CAD']
const TABS = ['Company', 'Roles & Permissions']

export default function SettingsPage() {
  const [tab,     setTab]     = useState('Company')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [roles,   setRoles]   = useState<any[]>([])
  const [form,    setForm]    = useState({ name: '', phone: '', address: '', timezone: 'America/New_York', currency: 'USD' })

  const canManage = usePermission('can_manage_settings')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const c = d.data?.company
        setCompany(c)
        setRoles(d.data?.roles || [])
        if (c) setForm({ name: c.name || '', phone: c.phone || '', address: c.address || '', timezone: c.timezone || 'America/New_York', currency: c.currency || 'USD' })
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const r = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (r.ok) toast.success('Settings saved!')
    else toast.error('Failed to save settings')
  }

  if (loading) return <div className="page-container"><Topbar title="Settings" /><PageLoading /></div>

  return (
    <div className="page-container">
      <Topbar title="Settings" />
      <div className="page-content space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Company settings */}
        {tab === 'Company' && (
          <div className="card p-6 max-w-xl">
            <h3 className="font-semibold text-slate-900 mb-5">Company Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Company Name</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!canManage} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={!canManage} />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea className="input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} disabled={!canManage} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} disabled={!canManage}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} disabled={!canManage}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {canManage && (
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
              {!canManage && (
                <p className="text-sm text-slate-400 italic">You don&apos;t have permission to modify these settings.</p>
              )}
            </div>
          </div>
        )}

        {/* Roles & Permissions */}
        {tab === 'Roles & Permissions' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Roles & Permissions Matrix</h3>
              <p className="text-xs text-slate-400 mt-1">Overview of which roles have which permissions.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Permission</th>
                    <th className="th">Module</th>
                    {roles.map((r: any) => <th key={r.id} className="th text-center">{r.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {roles.length > 0 && roles[0].permissions?.map((rp: any) => {
                    const perm = rp.permission
                    return (
                      <tr key={perm.id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-800">{perm.label}</td>
                        <td className="td"><span className="badge bg-slate-100 text-slate-600">{perm.module}</span></td>
                        {roles.map((r: any) => {
                          const has = r.permissions.some((p: any) => p.permission.id === perm.id)
                          return (
                            <td key={r.id} className="td text-center">
                              {has
                                ? <span className="text-green-600 text-base">✓</span>
                                : <span className="text-slate-200 text-base">—</span>
                              }
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
