import { Archive, BarChart3, BookOpen, Headphones, Inbox, LayoutGrid, Settings, Users, X } from 'lucide-react'
import Brand from './Brand'
import Avatar from './Avatar'

const nav = [
  [LayoutGrid, 'Queue Control'],
  [Inbox, 'My Tickets'],
  [Users, 'Team Workload'],
  [BarChart3, 'Reports'],
  [BookOpen, 'Knowledge Base'],
]

export default function Sidebar({ open, onClose, mode, setMode }) {
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
          {nav.map(([Icon, label], index) => (
            <button key={label} className={index === 0 ? 'active' : ''}><Icon size={18} /><span>{label}</span>{index === 1 && <b>8</b>}</button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sla-card">
            <div><span className="live-pulse" /> Your SLA today</div>
            <strong>96.4<small>%</small></strong>
            <div className="progress"><i style={{ width: '96%' }} /></div>
          </div>
          <button className="agent-card"><Avatar initials="AR" tone="purple" online /><span><strong>Alex Rivera</strong><small>Support Agent</small></span><Settings size={17} /></button>
        </div>
      </aside>
    </>
  )
}
