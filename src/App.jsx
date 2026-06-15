import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ToastProvider } from './components/Toast'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MobileHome from './pages/MobileHome'
import DashboardLayout from './pages/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Exhibitions from './pages/Exhibitions'
import Team from './pages/Team'
import Analytics from './pages/Analytics'
import Export from './pages/Export'
import './styles.css'

// Detect mobile vs desktop
function useIsMobile() {
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="loading-spin" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const isMobile = useIsMobile()

  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Mobile PWA — full experience */}
      {isMobile && (
        <Route path="/*" element={
          <RequireAuth><MobileHome /></RequireAuth>
        } />
      )}

      {/* Desktop dashboard */}
      {!isMobile && (
        <Route path="/" element={
          <RequireAuth><DashboardLayout /></RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="exhibitions" element={<Exhibitions />} />
          <Route path="team"        element={<Team />} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="export"      element={<Export />} />
        </Route>
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
