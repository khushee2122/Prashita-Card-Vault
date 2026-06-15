import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', orgName: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast('Passwords do not match', 'error'); return }
    if (form.password.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, orgName: form.orgName })
      toast('Account created! Please check your email to confirm.', 'success', 5000)
      navigate('/login')
    } catch (err) {
      toast(err.message || 'Signup failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24, background: 'var(--bg-base)'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)',
            borderRadius: 14, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px',
            boxShadow: 'var(--shadow-accent)'
          }}>
            <span style={{ fontSize: 26 }}>📇</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Your company gets its own private workspace
          </p>
        </div>

        <div className="card card-pad">
          <form onSubmit={handleSubmit} className="stack">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" placeholder="Raj Mehta" value={form.fullName} onChange={e => set('fullName', e.target.value)} required autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="form-label">Company / Organisation Name</label>
              <input className="form-input" placeholder="Acme Pvt Ltd" value={form.orgName} onChange={e => set('orgName', e.target.value)} required />
            </div>
            <div className="divider" />
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required autoComplete="new-password" />
            </div>

            <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
              🔒 Your data is completely private. No other company can see your leads.
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="loading-spin" /> : null}
              Create Account
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
