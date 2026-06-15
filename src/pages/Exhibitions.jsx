import { useState } from 'react'
import { Plus, Archive, Edit2, MapPin, Calendar, Users } from 'lucide-react'
import { useExhibitions, useLeads } from '../hooks/useLeads'
import { useToast } from '../components/Toast'

function ExhibitionForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { name: '', location: '', start_date: '', end_date: '' })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="stack">
      <div className="form-group">
        <label className="form-label">Exhibition Name *</label>
        <input className="form-input" placeholder="e.g. ACETECH Mumbai 2026" value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Location</label>
        <input className="form-input" placeholder="City, Venue" value={form.location} onChange={e => set('location', e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date</label>
          <input className="form-input" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>
      <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading-spin" /> : null} Save Exhibition
        </button>
      </div>
    </form>
  )
}

export default function Exhibitions() {
  const toast = useToast()
  const { exhibitions, loading, createExhibition, updateExhibition, archiveExhibition } = useExhibitions()
  const { leads } = useLeads()
  const [modal, setModal] = useState(null)
  const [editExh, setEditExh] = useState(null)
  const [saving, setSaving] = useState(false)

  const active   = exhibitions.filter(e => e.status === 'active')
  const archived = exhibitions.filter(e => e.status === 'archived')

  function leadsCount(exhId) { return leads.filter(l => l.exhibition_id === exhId).length }

  async function handleCreate(form) {
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    setSaving(true)
    try { await createExhibition(form); toast('Exhibition created!', 'success'); setModal(null) }
    catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleUpdate(form) {
    setSaving(true)
    try { await updateExhibition(editExh.id, form); toast('Updated!', 'success'); setModal(null); setEditExh(null) }
    catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleArchive(id) {
    if (!confirm('Archive this exhibition? It will still be viewable but marked as done.')) return
    try { await archiveExhibition(id); toast('Archived', 'default') }
    catch (err) { toast(err.message, 'error') }
  }

  function ExhCard({ exh }) {
    const count = leadsCount(exh.id)
    return (
      <div className="card card-pad">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{exh.name}</h3>
          <div className="flex-row" style={{ gap: 6 }}>
            {exh.status === 'active' && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditExh(exh); setModal('edit') }}><Edit2 size={14} /></button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleArchive(exh.id)}><Archive size={14} /> Archive</button>
              </>
            )}
          </div>
        </div>
        <div className="flex-row" style={{ gap: 16, flexWrap: 'wrap' }}>
          {exh.location && <span className="flex-row" style={{ gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}><MapPin size={13} /> {exh.location}</span>}
          {exh.start_date && (
            <span className="flex-row" style={{ gap: 5, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Calendar size={13} />
              {new Date(exh.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {exh.end_date && ` — ${new Date(exh.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </span>
          )}
          <span className="flex-row" style={{ gap: 5, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            <Users size={13} /> {count} lead{count !== 1 ? 's' : ''}
          </span>
          {exh.status === 'archived' && <span className="tag tag-other">Archived</span>}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Exhibitions</h1>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> New Exhibition
        </button>
      </div>
      <div className="page-body">
        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="loading-spin" /></div> : (
          <div className="stack" style={{ gap: 20 }}>
            {active.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Active</p>
                <div className="stack">{active.map(e => <ExhCard key={e.id} exh={e} />)}</div>
              </div>
            )}
            {archived.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Archived</p>
                <div className="stack">{archived.map(e => <ExhCard key={e.id} exh={e} />)}</div>
              </div>
            )}
            {exhibitions.length === 0 && (
              <div className="empty-state"><Calendar size={40} /><p>No exhibitions yet</p><span>Create your first one to start scanning cards</span></div>
            )}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditExh(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'create' ? 'New Exhibition' : 'Edit Exhibition'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setModal(null); setEditExh(null) }}>✕</button>
            </div>
            <div className="modal-body">
              <ExhibitionForm
                initial={modal === 'edit' ? editExh : undefined}
                onSave={modal === 'create' ? handleCreate : handleUpdate}
                onCancel={() => { setModal(null); setEditExh(null) }}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
