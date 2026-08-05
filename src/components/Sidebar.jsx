import { Archive, BarChart3, BookOpen, Headphones, Inbox, LayoutGrid, LogOut, ShieldCheck, Users, X } from 'lucide-react'
import Brand from './Brand'
import Avatar from './Avatar'
import { roleLabels } from '../auth/permissions'

const nav = [
  [LayoutGrid, 'Queue Control', 'queue', ['admin', 'manager', 'agent']],
  [Inbox, 'My Tickets', 'mine'],
  [Users, 'Team Workload', 'team', ['admin', 'manager']],
  [BarChart3, 'Reports', 'reports', ['admin', 'manager']],
  [BookOpen, 'Knowledge Base', 'knowledge'],
  [ShieldCheck, 'Access Control', 'admin', ['admin']],
]

export default function Sidebar({ open, onClose, mode, setMode, view, onNavigate, myTicketCount = 0, profile, onSignOut }) {
  const visibleNav = nav.filter(([, , , roles]) => !roles || roles.includes(profile?.role))
  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="Close menu" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand /><button className="icon-button mobile-only" onClick={onClose}><X size={18} /></button></div>
        <div className="queue-toggle">
          <button className={mode === 'active' ? 'selected' : ''} onClick={() => setMode('active')}><Headphones size={14} /> Active</button>
          <button className={mode === 'archive' ? 'selected' : ''} onClick={() => setMode('archive')}><Archive size={14} /> Archive</button>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <span className="eyebrow">Workspace</span>
          {visibleNav.map(([Icon, label, value]) => (
            <button key={label} className={view === value ? 'active' : ''} onClick={() => { onNavigate(value); onClose() }}><Icon size={18} /><span>{label}</span>{value === 'mine' && <b>{myTicketCount}</b>}</button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {profile?.role !== 'requester' && <div className="sla-card">
            <div><span className="live-pulse" /> Your SLA today</div>
            <strong>96.4<small>%</small></strong>
            <div className="progress"><i style={{ width: '96%' }} /></div>
          </div>}
          <div className="agent-card"><Avatar initials={profile?.full_name?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'U'} tone="purple" online /><span><strong>{profile?.full_name || 'User'}</strong><small>{roleLabels[profile?.role] || 'Member'}</small></span><button className="signout-button" title="Sign out" onClick={onSignOut}><LogOut size={17} /></button></div>
        </div>
      </aside>
    </>
  )
}
