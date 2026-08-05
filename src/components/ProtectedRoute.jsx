import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-page"><div className="panel auth-card"><span className="live-pulse" /> Loading workspace…</div></div>
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />
  return children
}
