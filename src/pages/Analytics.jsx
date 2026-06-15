import { useMemo } from 'react'
import { useLeads, useExhibitions } from '../hooks/useLeads'
import { TrendingUp, Users, Calendar, Tag } from 'lucide-react'

export default function Analytics() {
  const { leads, loading } = useLeads()
  const { exhibitions } = useExhibitions()

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return {
      total: leads.length,
      today: leads.filter(l => new Date(l.created_at).toDateString() === today).length,
      thisWeek: leads.filter(l => new Date(l.created_at) >= thisWeek).length,
      clients: leads.filter(l => l.lead_type === 'client').length,
      vendors: leads.filter(l => l.lead_type === 'vendor').length,
      other: leads.filter(l => l.lead_type === 'other' || !l.lead_type).length,
    }
  }, [leads])

  // Leads per exhibition
  const byExhibition = useMemo(() => {
    return exhibitions.map(exh => ({
      name: exh.name,
      count: leads.filter(l => l.exhibition_id === exh.id).length
    })).sort((a, b) => b.count - a.count)
  }, [leads, exhibitions])

  // Leads per day (last 14 days)
  const byDay = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      const count = leads.filter(l => new Date(l.created_at).toDateString() === d.toDateString()).length
      days.push({ label, count })
    }
    return days
  }, [leads])

  const maxDay = Math.max(...byDay.map(d => d.count), 1)

  // Leads by team member
  const byMember = useMemo(() => {
    const map = {}
    for (const lead of leads) {
      const name = lead.profiles?.full_name || 'Unknown'
      map[name] = (map[name] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [leads])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><span className="loading-spin" /></div>

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
      </div>
      <div className="page-body">
        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total Contacts</div></div>
          <div className="stat-card" style={{ borderTopColor: 'var(--success)' }}><div className="stat-number">{stats.today}</div><div className="stat-label">Added Today</div></div>
          <div className="stat-card" style={{ borderTopColor: 'var(--info)' }}><div className="stat-number">{stats.clients}</div><div className="stat-label">Clients</div></div>
          <div className="stat-card" style={{ borderTopColor: 'var(--warning)' }}><div className="stat-number">{stats.vendors}</div><div className="stat-label">Vendors</div></div>
        </div>

        <div className="grid-2" style={{ marginBottom: 28, alignItems: 'start' }}>
          {/* Daily chart */}
          <div className="card card-pad">
            <div className="flex-row" style={{ marginBottom: 20, gap: 8 }}>
              <TrendingUp size={18} color="var(--accent)" />
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>Last 14 Days</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {byDay.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.count / maxDay) * 100}%`,
                    minHeight: d.count > 0 ? 4 : 0,
                    background: d.count > 0 ? 'var(--accent)' : 'var(--border)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.3s ease',
                    position: 'relative'
                  }}>
                    {d.count > 0 && (
                      <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                        {d.count}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By exhibition */}
          <div className="card card-pad">
            <div className="flex-row" style={{ marginBottom: 16, gap: 8 }}>
              <Calendar size={18} color="var(--accent)" />
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>By Exhibition</h3>
            </div>
            {byExhibition.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No exhibitions yet</p>
              : byExhibition.map(({ name, count }) => (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div className="flex-between" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{name}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${stats.total ? (count / stats.total) * 100 : 0}%`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* By team member */}
        <div className="card card-pad" style={{ maxWidth: 480 }}>
          <div className="flex-row" style={{ marginBottom: 16, gap: 8 }}>
            <Users size={18} color="var(--accent)" />
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>By Team Member</h3>
          </div>
          {byMember.map(([name, count]) => (
            <div key={name} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14 }}>{name}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{count} lead{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
          {byMember.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>}
        </div>
      </div>
    </>
  )
}
