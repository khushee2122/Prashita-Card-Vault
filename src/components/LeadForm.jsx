import { useState } from 'react'

const EMPTY = {
  company_name: '', contact_person: '', mobile: '', email: '',
  address: '', designation: '', city: '', state: '', country: '',
  website: '', company_context: '', lead_type: '', notes: ''
}

export default function LeadForm({ initial = {}, exhibitionId, onSave, onCancel, loading }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, exhibition_id: exhibitionId })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack">
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            From Card
          </p>
          <div className="stack">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" type="text" placeholder="Company Name" value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-input" type="text" placeholder="Contact Person" value={form.contact_person || ''} onChange={e => set('contact_person', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input className="form-input" type="tel" placeholder="Mobile" value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="Email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" type="text" placeholder="Designation" value={form.designation || ''} onChange={e => set('designation', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" type="text" placeholder="Address" value={form.address || ''} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" type="text" placeholder="City" value={form.city || ''} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" type="text" placeholder="State" value={form.state || ''} onChange={e => set('state', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input className="form-input" type="text" placeholder="Country" value={form.country || ''} onChange={e => set('country', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" type="text" placeholder="www.example.com" value={form.website || ''} onChange={e => set('website', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Notes
          </p>
          <div className="stack">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.lead_type || ''} onChange={e => set('lead_type', e.target.value)}>
                <option value="">Select type</option>
                <option value="client">Client</option>
                <option value="vendor">Vendor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Company Context</label>
              <textarea className="form-textarea" placeholder="What does this company do? Why are they interesting?" value={form.company_context || ''} onChange={e => set('company_context', e.target.value)} style={{ minHeight: 70 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea className="form-textarea" placeholder="Anything else to remember about this conversation..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} style={{ minHeight: 70 }} />
            </div>
          </div>
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loading-spin" /> : null}
            Save Contact
          </button>
        </div>
      </div>
    </form>
  )
}
