'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const QUICK = [
  { label: 'Super Admin', email: 'superadmin@crm.com', color: '#d97706' },
  { label: 'Admin',       email: 'admin@crm.com',      color: '#2563eb' },
  { label: 'Manager',     email: 'manager@crm.com',    color: '#059669' },
  { label: 'Executive',   email: 'exec@crm.com',       color: '#7c3aed' },
  { label: 'Viewer',      email: 'viewer@crm.com',     color: '#64748b' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('admin@crm.com')
  const [password, setPassword] = useState('Admin@123')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center max-w-sm">
          <div className="text-4xl mb-4">⚡</div>
          <h1 className="text-3xl font-bold text-white mb-3">CRM Solution</h1>
          <p className="text-blue-200 text-base leading-relaxed mb-10">
            A complete sales management platform with role-based access, pipeline tracking, and real-time analytics.
          </p>
          <div className="text-left space-y-3">
            {['5 role-based access levels', 'Multi-company support', 'Real-time pipeline & kanban', 'Follow-ups & appointment tracking', 'Performance reports & analytics'].map(f => (
              <div key={f} className="flex items-center gap-3 text-blue-100 text-sm">
                <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-[460px] bg-white flex flex-col justify-center px-10 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Quick login */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
            Quick login — password: <code className="bg-slate-200 px-1 rounded">Admin@123</code>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(q => (
              <button
                key={q.label}
                type="button"
                onClick={() => { setEmail(q.email); setPassword('Admin@123') }}
                className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors hover:opacity-80"
                style={{ borderColor: q.color, color: q.color, background: `${q.color}12` }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5 text-sm mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  )
}
