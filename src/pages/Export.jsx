import { useState } from 'react'
import { Download, FileText, Table2 } from 'lucide-react'
import { useLeads, useExhibitions } from '../hooks/useLeads'
import { useToast } from '../components/Toast'
import { exportToExcel, exportToCSV } from '../lib/export'

export default function Export() {
  const toast = useToast()
  const { leads } = useLeads()
  const { exhibitions } = useExhibitions()
  const [filterExh, setFilterExh] = useState('')
  const [filterType, setFilterType] = useState('')

  const filtered = leads.filter(l => {
    const matchExh  = !filterExh  || l.exhibition_id === filterExh
    const matchType = !filterType || l.lead_type === filterType
    return matchExh && matchType
  })

  // Enrich with exhibition name for export
  const enriched = filtered.map(l => ({
    ...l,
    exhibition_name: l.exhibitions?.name || '',
    scanned_by_name: l.profiles?.full_name || ''
  }))

  function handleExcel() {
    if (!enriched.length) { toast('No contacts to export', 'error'); return }
    exportToExcel(enriched, 'CardVault_Leads')
    toast(`Exported ${enriched.length} contacts to Excel`, 'success')
  }

  function handleCSV() {
    if (!enriched.length) { toast('No contacts to export', 'error'); return }
    exportToCSV(enriched, 'CardVault_Leads')
    toast(`Exported ${enriched.length} contacts to CSV`, 'success')
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Export</h1>
      </div>
      <div className="page-body" style={{ maxWidth: 560 }}>
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Filter before export</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Leave blank to export all contacts</p>
          <div className="stack">
            <div className="form-group">
              <label className="form-label">Exhibition</label>
              <select className="form-select" value={filterExh} onChange={e => setFilterExh(e.target.value)}>
                <option value="">All Exhibitions</option>
                {exhibitions.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Type</label>
              <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                <option value="client">Clients only</option>
                <option value="vendor">Vendors only</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''} will be exported
          </div>
        </div>

        <div className="grid-2">
          <button className="card" style={{ padding: 24, cursor: 'pointer', textAlign: 'center', gap: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid var(--border)', transition: 'all 0.15s' }}
            onClick={handleExcel}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--success)'; e.currentTarget.style.background = 'rgba(22,163,74,0.05)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
          >
            <Table2 size={32} color="var(--success)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Excel (.xlsx)</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Open in Excel or Google Sheets</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleExcel() }}>
              <Download size={14} /> Download
            </button>
          </button>

          <button className="card" style={{ padding: 24, cursor: 'pointer', textAlign: 'center', gap: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid var(--border)', transition: 'all 0.15s' }}
            onClick={handleCSV}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--info)'; e.currentTarget.style.background = 'rgba(2,132,199,0.05)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
          >
            <FileText size={32} color="var(--info)" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>CSV (.csv)</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>For CRM import or custom tools</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleCSV() }}>
              <Download size={14} /> Download
            </button>
          </button>
        </div>

        <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          <strong>Exported fields:</strong> Company, Contact, Mobile, Email, Designation, Address, City, State, Country, Website, Company Context, Type, Notes, Exhibition, Added By, Date
        </div>
      </div>
    </>
  )
}
