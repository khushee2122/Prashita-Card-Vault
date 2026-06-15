import { useState } from 'react'
import { Camera, Search, Home, BarChart2, LogOut, ChevronDown } from 'lucide-react'
import { useLeads } from '../hooks/useLeads'
import { useAuth } from '../hooks/useAuth'
import { signOut, uploadCardImage } from '../lib/supabase'
import { useToast } from '../components/Toast'
import LeadCard from '../components/LeadCard'
import LeadForm from '../components/LeadForm'
import Scanner from '../components/Scanner'
import ExhibitionPicker from '../components/ExhibitionPicker'

const TABS = [
  { id: 'home',   label: 'Home',   Icon: Home },
  { id: 'search', label: 'Search', Icon: Search },
  { id: 'stats',  label: 'Stats',  Icon: BarChart2 },
]

export default function MobileHome() {
  const { profile } = useAuth()
  const toast = useToast()

  const [exhibition, setExhibition] = useState(null)
  const [tab, setTab] = useState('home')
  const [modal, setModal] = useState(null) // null | 'scan' | 'form' | 'edit'
  const [scannedData, setScannedData] = useState({})
  const [scannedFiles, setScannedFiles] = useState({})
  const [editLead, setEditLead] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [newLeadIds, setNewLeadIds] = useState(new Set())

  const { leads, loading, addLead, updateLead, deleteLead } = useLeads(exhibition?.id || null)

  // Show exhibition picker until one is selected
  if (!exhibition) {
    return <ExhibitionPicker onSelect={exh => setExhibition(exh)} />
  }

  // ── Data helpers ──────────────────────────────────────────────
  const today = new Date().toDateString()
  const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === today)
  const filtered = leads.filter(l => {
    const q = searchQ.toLowerCase()
    return !q || [l.company_name, l.contact_person, l.mobile, l.email, l.city].some(v => v?.toLowerCase().includes(q))
  })

  // ── Actions ───────────────────────────────────────────────────
  function handleScanned(data, files) {
    setScannedData(data)
    setScannedFiles(files)
    setModal('form')
  }

  async function handleSave(formData) {
    setSaving(true)
    try {
      let card_front_url = null
      let card_back_url  = null

      if (scannedFiles.front) {
        card_front_url = await uploadCardImage(profile.org_id, scannedFiles.front, 'front')
      }
      if (scannedFiles.back) {
        card_back_url = await uploadCardImage(profile.org_id, scannedFiles.back, 'back')
      }

      const saved = await addLead({ ...formData, card_front_url, card_back_url })
      setNewLeadIds(s => new Set([...s, saved.id]))
      setTimeout(() => setNewLeadIds(s => { const n = new Set(s); n.delete(saved.id); return n }), 2000)

      toast('Contact saved!', 'success')
      setModal(null)
      setScannedData({})
      setScannedFiles({})
      setTab('home')
    } catch (err) {
      toast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(formData) {
    setSaving(true)
    try {
      await updateLead(editLead.id, formData)
      toast('Contact updated!', 'success')
      setModal(null)
      setEditLead(null)
    } catch (err) {
      toast(err.message || 'Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return
    try {
      await deleteLead(id)
      toast('Deleted', 'default')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="mobile-layout">
      {/* Header */}
      <div className="mobile-header">
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>📇 CardVault</p>
          <button
            onClick={() => setExhibition(null)}
            style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {exhibition.name} <ChevronDown size={12} />
          </button>
        </div>
        <button
          onClick={async () => { await signOut(); window.location.href = '/login' }}
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px 8px' }}
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="mobile-content">
        {/* HOME TAB */}
        {tab === 'home' && (
          <div style={{ padding: '16px 14px' }}>
            <button className="btn-scan" onClick={() => setModal('scan')}>
              <Camera size={22} /> Scan New Card
            </button>

            <div style={{ marginTop: 22 }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  Today's Leads
                  <span style={{ marginLeft: 8, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600 }}>
                    {todayLeads.length}
                  </span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: {leads.length}</p>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><span className="loading-spin" /></div>
              ) : todayLeads.length === 0 ? (
                <div className="empty-state">
                  <Camera size={40} />
                  <p>No cards scanned today</p>
                  <span>Tap "Scan New Card" to start</span>
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  {todayLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isNew={newLeadIds.has(lead.id)}
                      onEdit={l => { setEditLead(l); setModal('edit') }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <div style={{ padding: '14px' }}>
            <div className="search-wrap" style={{ marginBottom: 14 }}>
              <Search size={16} />
              <input
                className="form-input search-input"
                placeholder="Search by name, company, phone…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                autoFocus
              />
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Search size={36} />
                <p>{searchQ ? 'No contacts match your search' : 'All contacts will appear here'}</p>
              </div>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {filtered.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onEdit={l => { setEditLead(l); setModal('edit') }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div style={{ padding: '14px' }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Overview</p>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="stat-card"><div className="stat-number">{leads.length}</div><div className="stat-label">Total Contacts</div></div>
              <div className="stat-card"><div className="stat-number">{todayLeads.length}</div><div className="stat-label">Today</div></div>
              <div className="stat-card"><div className="stat-number">{leads.filter(l => l.lead_type === 'client').length}</div><div className="stat-label">Clients</div></div>
              <div className="stat-card"><div className="stat-number">{leads.filter(l => l.lead_type === 'vendor').length}</div><div className="stat-label">Vendors</div></div>
            </div>

            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>By Team Member</p>
            {Object.entries(
              leads.reduce((acc, l) => {
                const name = l.profiles?.full_name || 'Unknown'
                acc[name] = (acc[name] || 0) + 1
                return acc
              }, {})
            ).map(([name, count]) => (
              <div key={name} className="card" style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{name}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`bottom-nav-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Scanner modal */}
      {modal === 'scan' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Scan Card</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <Scanner onScanned={handleScanned} onClose={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}

      {/* New lead form modal */}
      {modal === 'form' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxHeight: '96dvh' }}>
            <div className="modal-header">
              <h3 className="modal-title">New Contact</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setModal(null); setScannedData({}) }}>✕</button>
            </div>
            <div className="modal-body">
              <LeadForm
                initial={scannedData}
                exhibitionId={exhibition.id}
                onSave={handleSave}
                onCancel={() => { setModal(null); setScannedData({}) }}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modal === 'edit' && editLead && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxHeight: '96dvh' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Contact</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setModal(null); setEditLead(null) }}>✕</button>
            </div>
            <div className="modal-body">
              <LeadForm
                initial={editLead}
                exhibitionId={exhibition.id}
                onSave={handleUpdate}
                onCancel={() => { setModal(null); setEditLead(null) }}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
