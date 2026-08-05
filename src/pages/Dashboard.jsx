import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowUp, ChevronDown, CircleCheck, CirclePause, Download, Filter, Inbox, Menu, Mic2, Plus, Search, SlidersHorizontal } from 'lucide-react'
import Avatar from '../components/Avatar'
import Sidebar from '../components/Sidebar'
import StatusPill from '../components/StatusPill'
import TrendChart from '../components/TrendChart'
import { isSupabaseConfigured, listTickets, subscribeToTickets } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'
import { can, isStaff } from '../auth/permissions'

const statDefinitions = [
  { label: 'Open', icon: Inbox, color: 'cyan', spark: [14, 25, 20, 34, 30, 48] },
  { label: 'In Progress', icon: Activity, color: 'pink', spark: [38, 30, 35, 25, 29, 21] },
  { label: 'On Hold', icon: CirclePause, color: 'gold', spark: [20, 21, 19, 20, 20, 21] },
  { label: 'Resolved', icon: CircleCheck, color: 'lime', spark: [15, 22, 29, 26, 41, 50] },
]

function Sparkline({ values }) {
  const pts = values.map((value, i) => `${i * 36},${44 - value * .72}`).join(' ')
  return <svg className="spark" viewBox="0 0 180 46" preserveAspectRatio="none"><polyline points={pts} /></svg>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, role, signOut } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('All')
  const [threshold, setThreshold] = useState(72)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queueMode, setQueueMode] = useState('active')
  const [workspaceView, setWorkspaceView] = useState(isStaff(role) ? 'queue' : 'mine')
  const [dateRange, setDateRange] = useState('Last 7 days')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const rows = await listTickets()
        if (active) {
          setTickets(rows)
          setLoadError('')
        }
      } catch (error) {
        if (active) setLoadError(error.message)
      }
    }
    load()
    const unsubscribe = subscribeToTickets(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    const matchesSearch = `${ticket.id} ${ticket.subject} ${ticket.requester}`.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priority === 'All' || ticket.priority === priority
    const matchesQueue = queueMode === 'active' ? ticket.status !== 'Resolved' : ticket.status === 'Resolved'
    const matchesView = workspaceView === 'mine' && isStaff(role) ? ticket.assignedTo === profile?.full_name : true
    return matchesSearch && matchesPriority && matchesQueue && matchesView
  }), [tickets, search, priority, queueMode, workspaceView, role, profile])

  const stats = useMemo(() => statDefinitions.map(stat => ({
    ...stat,
    value: tickets.filter(ticket => ticket.status === stat.label).length,
  })), [tickets])

  const myTicketCount = isStaff(role) ? tickets.filter(ticket => ticket.assignedTo === profile?.full_name && ticket.status !== 'Resolved').length : tickets.filter(ticket => ticket.status !== 'Resolved').length
  const queueTitle = !isStaff(role) ? 'My Support Requests' : workspaceView === 'mine' ? 'My Tickets' : workspaceView === 'team' ? 'Team Workload' : queueMode === 'active' ? 'Active Tickets' : 'Ticket Archive'
  const viewCopy = {
    queue: ['Live operations', `Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}`, 'Monitor the support queue and act on incoming work.'],
    mine: ['Personal queue', 'My assigned tickets', isStaff(role) ? 'Focus on requests currently assigned to you.' : 'Track your requests or ask the support team for help.'],
    team: ['Team operations', 'Team workload', 'Review assigned and unassigned work across the support team.'],
    reports: ['Analytics', 'Support reports', 'Review ticket volume, response patterns, and queue distribution.'],
  }[workspaceView] || ['Support workspace', 'HelpDesk Lite', 'Manage support work.']
  const categorySummary = useMemo(() => {
    const groups = { Technical: 0, Billing: 0, Access: 0, Other: 0 }
    tickets.forEach(ticket => {
      const category = ticket.category.toLowerCase()
      if (category.includes('technical')) groups.Technical += 1
      else if (category.includes('billing')) groups.Billing += 1
      else if (category.includes('access')) groups.Access += 1
      else groups.Other += 1
    })
    const colors = { Technical: 'cyan', Billing: 'pink', Access: 'gold', Other: 'lime' }
    return Object.entries(groups).map(([name, count]) => ({ name, count, color: colors[name], percent: tickets.length ? Math.round(count / tickets.length * 100) : 0 }))
  }, [tickets])

  const navigateWorkspace = value => {
    if (value === 'knowledge') {
      navigate('/submit?knowledge=1')
      return
    }
    if (value === 'admin') {
      navigate('/admin/users')
      return
    }
    setWorkspaceView(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showNotice = message => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const exportTickets = () => {
    const escapeCsv = value => `"${String(value).replaceAll('"', '""')}"`
    const csv = ['Ticket,Subject,Requester,Priority,Status', ...filteredTickets.map(t => [t.id, t.subject, t.requester, t.priority, t.status].map(escapeCsv).join(','))].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = 'helpdesk-tickets.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={queueMode} setMode={setQueueMode} view={workspaceView} onNavigate={navigateWorkspace} myTicketCount={myTicketCount} profile={profile} onSignOut={() => signOut().catch(error => showNotice(error.message))} />
      <main className="dashboard-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <label className="search-box"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets, people…" /></label>
          <div className="top-actions">
            <button className="select-button" onClick={() => setDateRange(dateRange === 'Last 7 days' ? 'Last 30 days' : 'Last 7 days')}>{dateRange}<ChevronDown size={14} /></button>
            <button className="icon-button desktop-only" title="Download ticket CSV" onClick={exportTickets}><Download size={18} /></button>
            <button className="gradient-outline" onClick={() => navigate('/submit')}><span><Plus size={16} /> Submit Ticket</span></button>
            <Avatar initials={profile?.full_name?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'U'} tone="purple" online />
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-intro">
            <div><span className="eyebrow cyan-text">{viewCopy[0]}</span><h1>{viewCopy[1]}</h1><p>{viewCopy[2]}</p></div>
            <div className="updated"><span className="live-pulse" /> {isSupabaseConfigured ? 'Synced with Supabase' : 'Demo data · Supabase not configured'}</div>
          </section>

          {workspaceView === 'reports' && can(role, 'reports:view') && <section className="panel chart-panel" id="reports">
            <div className="panel-heading"><div><h2>Weekly Ticket Trends</h2><p>Illustrative volume pattern; live reporting is the next data milestone</p></div><div className="legend"><span><i className="lime-bg" />Incoming</span><span><i className="cyan-bg" />Resolved</span></div></div>
            <TrendChart />
          </section>}

          {workspaceView === 'queue' && <section className="stats-grid">
            {stats.map(stat => {
              const Icon = stat.icon
              return <article className={`panel stat-card accent-${stat.color}`} key={stat.label}>
                <div><span>{stat.label}</span><i><Icon size={17} /></i></div>
                <strong>{stat.value}</strong>
                <small><em>Live ticket count</em></small>
                <Sparkline values={stat.spark} />
              </article>
            })}
          </section>}

          {workspaceView === 'queue' && isStaff(role) && <section className="split-grid">
            <article className="panel control-card">
              <div className="panel-heading"><div><h3>SLA Urgency Monitor</h3><p>Set the response-time threshold before alerts fire.</p></div><span className="live-label"><i className="live-pulse" /> Live</span></div>
              <div className="range-value" style={{ left: `calc(${threshold}% - 24px)` }}>{Math.max(1, Math.round(48 - threshold * .47))}h</div>
              <input aria-label="SLA threshold" type="range" min="0" max="100" value={threshold} onChange={e => setThreshold(e.target.value)} />
              <div className="range-labels"><span>Relaxed · 48h</span><span>Current</span><span>Strict · 1h</span></div>
              <div className="mini-stats"><div><strong>{Math.max(1, Math.round(48 - threshold * .47))}h</strong><span>Avg first reply</span></div><div><strong>3.4</strong><span>Breached today</span></div><div><strong>96%</strong><span>Within SLA</span></div></div>
            </article>
            <article className="panel voice-card">
              <div className="panel-heading"><div><h3>Voice Channel Activity</h3><p>Demo phone queue and agent availability.</p></div><button className="text-button" onClick={() => showNotice('Voice integrations are not connected yet.')}>Details <SlidersHorizontal size={14} /></button></div>
              <div className="voice-content"><div className="voice-orbit"><span><Mic2 size={23} /></span><i /><i /><i /></div><div className="voice-metrics"><div><b>07</b><small>In queue</small></div><div><b>2:14</b><small>Avg wait</small></div><div><b className="lime-text">18</b><small>Agents online</small></div></div></div>
            </article>
          </section>}

          {workspaceView === 'reports' && can(role, 'reports:view') && <section className="insights-grid">
            <article className="panel delay-card">
              <div className="panel-heading"><div><h3>Response Delay by Channel</h3><p>Sample operational targets</p></div><button className="text-button" onClick={() => setDateRange(dateRange === 'Last 7 days' ? 'Last 30 days' : 'Last 7 days')}>{dateRange} <ChevronDown size={13} /></button></div>
              {[['Email', 76, '18m'], ['Chat', 42, '6m'], ['Portal', 59, '11m'], ['Voice', 28, '3m']].map(([name, width, value]) => <div className="delay-row" key={name}><span>{name}</span><div><i style={{ width: `${width}%` }} /></div><b>{value}</b></div>)}
            </article>
            <article className="panel category-card">
              <div><h3>Ticket Category</h3><p>Current queue mix</p></div>
              <div className="donut"><div><strong>{tickets.length}</strong><span>Total</span></div></div>
              <div className="category-list">{categorySummary.map(category => <span key={category.name}><i className={`${category.color}-bg`} />{category.name} <b>{category.percent}%</b></span>)}</div>
            </article>
          </section>}

          {workspaceView !== 'reports' && <section className="panel tickets-panel" id="tickets">
            <div className="panel-heading ticket-heading"><div><h3>{queueTitle}</h3><p>{filteredTickets.length} tickets shown</p></div><div className="ticket-tools"><label><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" /></label><div className="priority-menu"><Filter size={14} /><select value={priority} onChange={e => setPriority(e.target.value)}><option>All</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select></div></div></div>
            <div className="ticket-list">
              {loadError && <div className="empty-state"><b>Could not load tickets</b><span>{loadError}</span></div>}
              {filteredTickets.map(ticket => <button className="ticket-row" key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                <Avatar initials={ticket.initials} tone={ticket.tone} />
                <span className="ticket-summary"><b>{ticket.subject}</b><small>{ticket.id} · {ticket.requester}</small></span>
                <span className={`priority priority-${ticket.priority.toLowerCase()}`}><i />{ticket.priority}</span>
                <StatusPill value={ticket.status} />
                <span className="ticket-time">{workspaceView === 'team' ? ticket.assignedTo || 'Unassigned' : ticket.updated}</span>
                <ArrowUp size={15} className="row-arrow" />
              </button>)}
              {!loadError && !filteredTickets.length && <div className="empty-state"><Search size={24} /><b>No tickets found</b><span>Try a different search or priority.</span></div>}
            </div>
          </section>}
        </div>
      </main>
      {notice && <div className="app-toast" role="status">{notice}</div>}
    </div>
  )
}
