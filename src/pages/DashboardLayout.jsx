import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, BarChart2, Download, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase'

const NAV = [
  { to: '/dashboard',      label: 'Leads',        Icon: LayoutDashboard },
  { to: '/exhibitions',    label: 'Exhibitions',   Icon: Calendar },
  { to: '/team',           label: 'Team',          Icon: Users },
  { to: '/analytics',      label: 'Analytics',     Icon: BarChart2 },
  { to: '/export',         label: 'Export',        Icon: Download },
]

export default function DashboardLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><span style={{ fontSize: 18 }}>📇</span></div>
          <span className="logo-text">CardVault</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="org-name">{profile?.orgs?.name || 'My Company'}</p>
          <p className="user-email">{profile?.full_name}</p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10, gap: 6, padding: '6px 0', color: 'var(--danger)' }}
            onClick={handleSignOut}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
