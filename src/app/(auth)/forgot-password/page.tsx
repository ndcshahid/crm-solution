'use client'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Reset link sent!')
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 w-full max-w-md">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-500 text-sm mb-6">We sent a password reset link to <strong>{email}</strong></p>
            <Link href="/login" className="btn btn-primary w-full py-2.5">Back to Login</Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Forgot password?</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your email and we&apos;ll send a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <button type="submit" className="btn btn-primary w-full py-2.5">Send Reset Link</button>
            </form>
            <p className="mt-5 text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
