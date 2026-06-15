import { useState } from 'react'
import { X } from 'lucide-react'

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

  function Field({ label, name, type = 'text', placeholder }) {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          className="form-input"
          type={type}
          placeholder={placeholder || label}
          value={form[name] || ''}
          onChange={e => set(name, e.target.value)}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack">

        {/* OCR-populated fields */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            From Card
          </p>
          <div className="stack">
            <div className="grid-2">
              <Field label="Company Name" name="company_name" />
              <Field label="Contact Person" name="contact_person" />
            </div>
            <div className="grid-2">
              <Field label="Mobile" name="mobile" type="tel" />
              <Field label="Email" name="email" type="email" />
            </div>
            <Field label="Designation" name="designation" />
            <Field label="Address" name="address" />
            <div className="grid-3">
              <Field label="City" name="city" />
              <Field label="State" name="state" />
              <Field label="Country" name="country" />
            </div>
            <Field label="Website" name="website" type="url" placeholder="https://" />
          </div>
        </div>

        {/* Manual fields */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Notes
          </p>
          <div className="stack">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={form.lead_type || ''}
                onChange={e => set('lead_type', e.target.value)}
              >
                <option value="">Select type</option>
                <option value="client">Client</option>
                <option value="vendor">Vendor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Company Context</label>
              <textarea
                className="form-textarea"
                placeholder="What does this company do? Why are they interesting?"
                value={form.company_context || ''}
                onChange={e => set('company_context', e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Anything else to remember about this conversation..."
                value={form.notes || ''}
                onChange={e => set('notes', e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>
          </div>
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loading-spin" /> : null}
            Save Contact
          </button>
        </div>
      </div>
    </form>
  )
}
