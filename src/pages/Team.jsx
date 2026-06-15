import { useState } from 'react'
import { UserPlus, Trash2, Mail, Crown } from 'lucide-react'
import { useTeam } from '../hooks/useLeads'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

export default function Team() {
  const { profile } = useAuth()
  const toast = useToast()
  const { members, invites, loading, inviteMember, removeMember } = useTeam()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const isAdmin = profile?.role === 'admin'

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSaving(true)
    try {
      await inviteMember(email.trim())
      toast(`Invite recorded for ${email}`, 'success')
      setEmail('')
    } catch (err) {
      toast(err.message, 'error')
    } finally { setSaving(false) }
  }

  async function handleRemove(memberId, name) {
    if (!confirm(`Remove ${name} from the team?`)) return
    try { await removeMember(memberId); toast('Member removed', 'default') }
    catch (err) { toast(err.message, 'error') }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Team</h1>
      </div>
      <div className="page-body" style={{ maxWidth: 600 }}>
        {/* Invite */}
        {isAdmin && (
          <div className="card card-pad" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Invite Team Member</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Share your app URL with the person and ask them to sign up. Their account will be linked to your organisation automatically when they use the invite email.
            </p>
            <form onSubmit={handleInvite}>
              <div className="flex-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flexShrink: 0 }}>
                  {saving ? <span className="loading-spin" /> : <UserPlus size={16} />}
                  Invite
                </button>
              </div>
            </form>
            <div style={{ marginTop: 12, background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong>How to onboard a new member:</strong> Share the app URL. They sign up with the invited email address. They'll automatically join your organisation.
            </div>
          </div>
        )}

        {/* Members */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 700 }}>Members ({members.length})</h3>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="loading-spin" /></div> : (
            <div>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--accent-soft)', border: '2px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'var(--accent)', fontSize: 15, flexShrink: 0
                  }}>
                    {(m.full_name || m.id)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex-row" style={{ gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{m.full_name || 'Unnamed'}</p>
                      {m.role === 'admin' && (
                        <span className="flex-row" style={{ gap: 3, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
                          <Crown size={11} /> Admin
                        </span>
                      )}
                      {m.id === profile?.id && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(you)</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      Joined {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {isAdmin && m.id !== profile?.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.id, m.full_name)}>
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 700 }}>Pending Invites ({invites.length})</h3>
            </div>
            {invites.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)', gap: 10 }}>
                <Mail size={16} color="var(--text-muted)" />
                <p style={{ fontSize: 14, flex: 1 }}>{inv.email}</p>
                <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 500 }}>Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
