import { useState } from 'react'
import { Phone, Mail, Globe, MapPin, Edit2, Trash2, ChevronDown, ChevronUp, Image } from 'lucide-react'

function TypeTag({ type }) {
  if (!type) return null
  return <span className={`tag tag-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
}

export default function LeadCard({ lead, onEdit, onDelete, isNew }) {
  const [expanded, setExpanded] = useState(false)
  const [showCards, setShowCards] = useState(false)

  const name = lead.contact_person || lead.company_name || 'Unknown Contact'
  const sub  = lead.contact_person ? lead.company_name : lead.designation

  return (
    <div className={`lead-card ${isNew ? 'is-new' : ''}`} onClick={() => setExpanded(e => !e)}>
      {/* Header row */}
      <div className="flex-between" style={{ gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex-row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3 }}>{name}</p>
            <TypeTag type={lead.lead_type} />
          </div>
          {sub && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</p>}
          {lead.designation && lead.contact_person && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{lead.designation}</p>
          )}
        </div>
        <div className="flex-row" style={{ gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => onEdit(lead)} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }} onClick={() => onDelete(lead.id)} title="Delete">
            <Trash2 size={14} />
          </button>
          <span style={{ color: 'var(--text-muted)' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {/* Quick contact row */}
      <div className="flex-row" style={{ marginTop: 10, gap: 16, flexWrap: 'wrap' }}>
        {lead.mobile && (
          <a href={`tel:${lead.mobile}`} className="flex-row" style={{ gap: 5, fontSize: 13, color: 'var(--info)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
            <Phone size={13} /> {lead.mobile}
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex-row" style={{ gap: 5, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
            <Mail size={13} /> {lead.email}
          </a>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
          <div className="stack" style={{ gap: 10 }}>
            {lead.address && (
              <div className="flex-row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {[lead.address, lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {lead.website && (
              <div className="flex-row" style={{ gap: 8 }}>
                <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent)' }}>
                  {lead.website}
                </a>
              </div>
            )}
            {lead.company_context && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Company Context</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lead.company_context}</p>
              </div>
            )}
            {lead.notes && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lead.notes}</p>
              </div>
            )}
            {lead.exhibitions?.name && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Exhibition: <strong style={{ color: 'var(--text-secondary)' }}>{lead.exhibitions.name}</strong>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Added: {new Date(lead.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              {lead.profiles?.full_name && ` · by ${lead.profiles.full_name}`}
            </div>

            {/* Card images */}
            {(lead.card_front_url || lead.card_back_url) && (
              <div>
                <button className="btn btn-ghost btn-sm" style={{ gap: 6, padding: '4px 0' }} onClick={() => setShowCards(s => !s)}>
                  <Image size={14} /> {showCards ? 'Hide' : 'View'} Card Images
                </button>
                {showCards && (
                  <div className="grid-2" style={{ marginTop: 10, gap: 10 }}>
                    {lead.card_front_url && <img src={lead.card_front_url} alt="Card front" style={{ borderRadius: 8, width: '100%', border: '1px solid var(--border)' }} />}
                    {lead.card_back_url  && <img src={lead.card_back_url}  alt="Card back"  style={{ borderRadius: 8, width: '100%', border: '1px solid var(--border)' }} />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
