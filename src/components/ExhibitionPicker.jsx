import { useState } from 'react'
import { MapPin, Calendar, Plus, ChevronRight } from 'lucide-react'
import { useExhibitions } from '../hooks/useLeads'

export default function ExhibitionPicker({ onSelect }) {
  const { exhibitions, loading, createExhibition } = useExhibitions()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', start_date: '', end_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const active = exhibitions.filter(e => e.status === 'active')
  const archived = exhibitions.filter(e => e.status === 'archived')

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Exhibition name is required'); return }
    setSaving(true)
    try {
      const exh = await createExhibition(form)
      onSelect(exh)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, zIndex: 500
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)',
            borderRadius: 14, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px',
            boxShadow: 'var(--shadow-accent)'
          }}>
            <span style={{ fontSize: 26 }}>📇</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Select Exhibition</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            All cards you scan will be tagged to this exhibition
          </p>
        </div>

        {/* Active exhibitions */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <span className="loading-spin" />
          </div>
        ) : (
          <div className="stack">
            {active.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Active Exhibitions
                </p>
                <div className="stack" style={{ gap: 8 }}>
                  {active.map(exh => (
                    <button
                      key={exh.id}
                      className="card"
                      style={{
                        width: '100%', padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', textAlign: 'left',
                        border: '1.5px solid var(--border)',
                        transition: 'all 0.15s'
                      }}
                      onClick={() => onSelect(exh)}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{exh.name}</p>
                        <div className="flex-row" style={{ marginTop: 4, gap: 12, flexWrap: 'wrap' }}>
                          {exh.location && (
                            <span className="flex-row" style={{ gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                              <MapPin size={12} /> {exh.location}
                            </span>
                          )}
                          {exh.start_date && (
                            <span className="flex-row" style={{ gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                              <Calendar size={12} /> {new Date(exh.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {archived.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Archived
                </p>
                <div className="stack" style={{ gap: 6 }}>
                  {archived.map(exh => (
                    <button key={exh.id} className="card" style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', opacity: 0.65 }} onClick={() => onSelect(exh)}>
                      <p style={{ fontWeight: 500, color: 'var(--text-secondary)', flex: 1, fontSize: 14 }}>{exh.name}</p>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create new */}
            {!creating ? (
              <button
                className="btn btn-secondary btn-block"
                style={{ marginTop: 8, padding: '12px 16px', justifyContent: 'center', gap: 8 }}
                onClick={() => setCreating(true)}
              >
                <Plus size={16} /> Create New Exhibition
              </button>
            ) : (
              <form onSubmit={handleCreate} className="card card-pad stack" style={{ gap: 14 }}>
                <p style={{ fontWeight: 600, fontSize: 15 }}>New Exhibition</p>
                {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" placeholder="e.g. ACETECH Mumbai 2026" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="City, Venue" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
                <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="loading-spin" /> : <Plus size={16} />}
                    Create & Select
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
