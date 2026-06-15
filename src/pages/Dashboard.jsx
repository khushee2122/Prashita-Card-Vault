import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react'
import { useLeads, useExhibitions } from '../hooks/useLeads'
import { uploadCardImage } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import LeadForm from '../components/LeadForm'
import Scanner from '../components/Scanner'

function TypeTag({ type }) {
  if (!type) return <span className="tag tag-other">—</span>
  return <span className={`tag tag-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
}

export default function Dashboard() {
  const { profile } = useAuth()
  const toast = useToast()
  const { leads, loading, addLead, updateLead, deleteLead } = useLeads()
  const { exhibitions } = useExhibitions()

  const [searchQ, setSearchQ] = useState('')
  const [filterExh, setFilterExh] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(null) // null | 'scan' | 'form' | 'edit'
  const [scannedData, setScannedData] = useState({})
  const [scannedFiles, setScannedFiles] = useState({})
  const [editLead, setEditLead] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeExhibition, setActiveExhibition] = useState(null)

  const filtered = leads.filter(l => {
    const q = searchQ.toLowerCase()
    const matchQ = !q || [l.company_name, l.contact_person, l.mobile, l.email, l.city, l.designation].some(v => v?.toLowerCase().includes(q))
    const matchExh = !filterExh || l.exhibition_id === filterExh
    const matchType = !filterType || l.lead_type === filterType
    return matchQ && matchExh && matchType
  })

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
      if (scannedFiles.front) card_front_url = await uploadCardImage(profile.org_id, scannedFiles.front, 'front')
      if (scannedFiles.back)  card_back_url  = await uploadCardImage(profile.org_id, scannedFiles.back, 'back')
      await addLead({ ...formData, card_front_url, card_back_url, exhibition_id: activeExhibition })
      toast('Contact saved!', 'success')
      setModal(null)
      setScannedData({}); setScannedFiles({})
    } catch (err) {
      toast(err.message, 'error')
    } finally { setSaving(false) }
  }

  async function handleUpdate(formData) {
    setSaving(true)
    try {
      await updateLead(editLead.id, formData)
      toast('Updated!', 'success')
      setModal(null); setEditLead(null)
    } catch (err) {
      toast(err.message, 'error')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    try { await deleteLead(id); toast('Deleted', 'default') }
    catch (err) { toast(err.message, 'error') }
  }

  const activeExhibitions = exhibitions.filter(e => e.status === 'active')

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">All Leads</h1>
        <button className="btn btn-primary" onClick={() => setModal('scan')}>
          <Plus size={16} /> Add Contact
        </button>
      </div>

      <div className="page-body">
        {/* Filters row */}
        <div className="flex-row" style={{ gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} />
            <input
              className="form-input search-input"
              placeholder="Search name, company, phone, email…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={filterExh} onChange={e => setFilterExh(e.target.value)}>
            <option value="">All Exhibitions</option>
            {exhibitions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="client">Client</option>
            <option value="vendor">Vendor</option>
            <option value="other">Other</option>
          </select>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><span className="loading-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Search size={40} />
              <p>No contacts found</p>
              <span>{searchQ || filterExh || filterType ? 'Try adjusting your filters' : 'Add your first contact with the button above'}</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Type</th>
                    <th>Exhibition</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company_name || '—'}</td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contact_person || '—'}</td>
                      <td style={{ fontSize: 13 }}>{lead.mobile || '—'}</td>
                      <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lead.designation || '—'}</td>
                      <td><TypeTag type={lead.lead_type} /></td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lead.exhibitions?.name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td>
                        <div className="flex-row" style={{ gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 7px' }} onClick={() => { setEditLead(lead); setModal('edit') }}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-danger btn-sm" style={{ padding: '4px 7px' }} onClick={() => handleDelete(lead.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === 'scan' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Scan Card</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Exhibition</label>
                <select className="form-select" value={activeExhibition || ''} onChange={e => setActiveExhibition(e.target.value || null)}>
                  <option value="">No exhibition</option>
                  {activeExhibitions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <Scanner onScanned={handleScanned} onClose={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}

      {modal === 'form' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxHeight: '92dvh' }}>
            <div className="modal-header">
              <h3 className="modal-title">New Contact</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <LeadForm initial={scannedData} exhibitionId={activeExhibition} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
            </div>
          </div>
        </div>
      )}

      {modal === 'edit' && editLead && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxHeight: '92dvh' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Contact</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setModal(null); setEditLead(null) }}>✕</button>
            </div>
            <div className="modal-body">
              <LeadForm initial={editLead} exhibitionId={editLead.exhibition_id} onSave={handleUpdate} onCancel={() => { setModal(null); setEditLead(null) }} loading={saving} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
