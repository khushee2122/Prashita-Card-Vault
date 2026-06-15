import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form)
      navigate('/')
    } catch (err) {
      toast(err.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24, background: 'var(--bg-base)'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)',
            borderRadius: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: 'var(--shadow-accent)'
          }}>
            <span style={{ fontSize: 28 }}>📇</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>CardVault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Exhibition lead management
          </p>
        </div>

        <div className="card card-pad">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Sign in</h2>
          <form onSubmit={handleSubmit} className="stack">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="loading-spin" /> : null}
              Sign In
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          New company?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
