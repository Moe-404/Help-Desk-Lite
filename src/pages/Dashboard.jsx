import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowDown, ArrowUp, ChevronDown, CircleCheck, CirclePause, Download, Filter, Inbox, Menu, Mic2, Plus, Search, SlidersHorizontal, Timer, TrendingDown, TrendingUp, Users } from 'lucide-react'
import Avatar from '../components/Avatar'
import Sidebar from '../components/Sidebar'
import StatusPill from '../components/StatusPill'
import TrendChart from '../components/TrendChart'
import { tickets } from '../data'

const stats = [
  { label: 'Open', value: '128', change: '9%', direction: 'up', icon: Inbox, color: 'cyan', spark: [14, 25, 20, 34, 30, 48] },
  { label: 'In Progress', value: '64', change: '3%', direction: 'down', icon: Activity, color: 'pink', spark: [38, 30, 35, 25, 29, 21] },
  { label: 'On Hold', value: '21', change: '0%', direction: 'flat', icon: CirclePause, color: 'gold', spark: [20, 21, 19, 20, 20, 21] },
  { label: 'Resolved', value: '1,402', change: '14%', direction: 'up', icon: CircleCheck, color: 'lime', spark: [15, 22, 29, 26, 41, 50] },
]

function Sparkline({ values }) {
  const pts = values.map((value, i) => `${i * 36},${44 - value * .72}`).join(' ')
  return <svg className="spark" viewBox="0 0 180 46" preserveAspectRatio="none"><polyline points={pts} /></svg>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('All')
  const [threshold, setThreshold] = useState(72)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [queueMode, setQueueMode] = useState('active')
  const [dateRange, setDateRange] = useState('Last 7 days')

  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    const matchesSearch = `${ticket.id} ${ticket.subject} ${ticket.requester}`.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priority === 'All' || ticket.priority === priority
    return matchesSearch && matchesPriority
  }), [search, priority])

  const exportTickets = () => {
    const csv = ['Ticket,Subject,Requester,Priority,Status', ...filteredTickets.map(t => `${t.id},"${t.subject}",${t.requester},${t.priority},${t.status}`)].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = 'helpdesk-tickets.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={queueMode} setMode={setQueueMode} />
      <main className="dashboard-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <label className="search-box"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets, people…" /></label>
          <div className="top-actions">
            <button className="select-button" onClick={() => setDateRange(dateRange === 'Last 7 days' ? 'Last 30 days' : 'Last 7 days')}>{dateRange}<ChevronDown size={14} /></button>
            <button className="icon-button desktop-only" title="Download ticket CSV" onClick={exportTickets}><Download size={18} /></button>
            <button className="gradient-outline" onClick={() => navigate('/submit')}><span><Plus size={16} /> Submit Ticket</span></button>
            <Avatar initials="AR" tone="purple" online />
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-intro">
            <div><span className="eyebrow cyan-text">Live operations</span><h1>Good morning, Alex</h1><p>Here’s what’s happening across your support workspace.</p></div>
            <div className="updated"><span className="live-pulse" /> Updated just now</div>
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading"><div><h2>Weekly Ticket Trends</h2><p>Incoming vs resolved volume across channels</p></div><div className="legend"><span><i className="lime-bg" />Incoming</span><span><i className="cyan-bg" />Resolved</span></div></div>
            <TrendChart />
          </section>

          <section className="stats-grid">
            {stats.map(stat => {
              const Icon = stat.icon
              return <article className={`panel stat-card accent-${stat.color}`} key={stat.label}>
                <div><span>{stat.label}</span><i><Icon size={17} /></i></div>
                <strong>{stat.value}</strong>
                <small className={stat.direction}>{stat.direction === 'up' ? <TrendingUp size={13} /> : stat.direction === 'down' ? <TrendingDown size={13} /> : '—'} {stat.change} <em>vs last week</em></small>
                <Sparkline values={stat.spark} />
              </article>
            })}
          </section>

          <section className="split-grid">
            <article className="panel control-card">
              <div className="panel-heading"><div><h3>SLA Urgency Monitor</h3><p>Set the response-time threshold before alerts fire.</p></div><span className="live-label"><i className="live-pulse" /> Live</span></div>
              <div className="range-value" style={{ left: `calc(${threshold}% - 24px)` }}>{Math.max(1, Math.round(48 - threshold * .47))}h</div>
              <input aria-label="SLA threshold" type="range" min="0" max="100" value={threshold} onChange={e => setThreshold(e.target.value)} />
              <div className="range-labels"><span>Relaxed · 48h</span><span>Current</span><span>Strict · 1h</span></div>
              <div className="mini-stats"><div><strong>{Math.max(1, Math.round(48 - threshold * .47))}h</strong><span>Avg first reply</span></div><div><strong>3.4</strong><span>Breached today</span></div><div><strong>96%</strong><span>Within SLA</span></div></div>
            </article>
            <article className="panel voice-card">
              <div className="panel-heading"><div><h3>Voice Channel Activity</h3><p>Live phone queue and agent availability.</p></div><button className="text-button">Settings <SlidersHorizontal size={14} /></button></div>
              <div className="voice-content"><div className="voice-orbit"><span><Mic2 size={23} /></span><i /><i /><i /></div><div className="voice-metrics"><div><b>07</b><small>In queue</small></div><div><b>2:14</b><small>Avg wait</small></div><div><b className="lime-text">18</b><small>Agents online</small></div></div></div>
            </article>
          </section>

          <section className="insights-grid">
            <article className="panel delay-card">
              <div className="panel-heading"><div><h3>Response Delay by Channel</h3><p>Average first response today</p></div><button className="text-button">This week <ChevronDown size={13} /></button></div>
              {[['Email', 76, '18m'], ['Chat', 42, '6m'], ['Portal', 59, '11m'], ['Voice', 28, '3m']].map(([name, width, value]) => <div className="delay-row" key={name}><span>{name}</span><div><i style={{ width: `${width}%` }} /></div><b>{value}</b></div>)}
            </article>
            <article className="panel category-card">
              <div><h3>Ticket Category</h3><p>Current queue mix</p></div>
              <div className="donut"><div><strong>213</strong><span>Total</span></div></div>
              <div className="category-list"><span><i className="cyan-bg" />Technical <b>42%</b></span><span><i className="pink-bg" />Billing <b>27%</b></span><span><i className="gold-bg" />Access <b>18%</b></span><span><i className="lime-bg" />Other <b>13%</b></span></div>
            </article>
          </section>

          <section className="panel tickets-panel">
            <div className="panel-heading ticket-heading"><div><h3>{queueMode === 'active' ? 'Active Tickets' : 'Ticket Archive'}</h3><p>{filteredTickets.length} tickets shown</p></div><div className="ticket-tools"><label><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" /></label><div className="priority-menu"><Filter size={14} /><select value={priority} onChange={e => setPriority(e.target.value)}><option>All</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select></div></div></div>
            <div className="ticket-list">
              {filteredTickets.map(ticket => <button className="ticket-row" key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                <Avatar initials={ticket.initials} tone={ticket.tone} />
                <span className="ticket-summary"><b>{ticket.subject}</b><small>{ticket.id} · {ticket.requester}</small></span>
                <span className={`priority priority-${ticket.priority.toLowerCase()}`}><i />{ticket.priority}</span>
                <StatusPill value={ticket.status} />
                <span className="ticket-time">{ticket.updated}</span>
                <ArrowUp size={15} className="row-arrow" />
              </button>)}
              {!filteredTickets.length && <div className="empty-state"><Search size={24} /><b>No tickets found</b><span>Try a different search or priority.</span></div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
