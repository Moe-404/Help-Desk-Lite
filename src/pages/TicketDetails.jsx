import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bolt, CheckCheck, ExternalLink, FileText, LockKeyhole, Mail, Paperclip, Phone, Send, Smile, UserPlus } from 'lucide-react'
import Avatar from '../components/Avatar'
import StatusPill from '../components/StatusPill'
import { tickets } from '../data'

export default function TicketDetails() {
  const navigate = useNavigate()
  const { ticketId } = useParams()
  const ticket = tickets.find(item => item.id === ticketId) || tickets[0]
  const [assigned, setAssigned] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [mode, setMode] = useState('reply')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const sendMessage = () => {
    if (!message.trim()) return
    setMessages(current => [...current, { body: message, mode }])
    setMessage('')
  }

  return (
    <div className="details-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="detail-header">
        <div><button className="icon-button" onClick={() => navigate('/')}><ArrowLeft size={19} /></button><i /><h1><span>#{ticket.id}</span><b>{ticket.subject}</b></h1></div>
        <div><button className="secondary-button" onClick={() => setAssigned(true)}>{assigned ? <CheckCheck size={15} /> : <UserPlus size={15} />}{assigned ? 'Assigned to you' : 'Assign to me'}</button><button className="resolve-button" disabled={resolved} onClick={() => setResolved(true)}><CheckCheck size={16} />{resolved ? 'Resolved' : 'Resolve Ticket'}</button></div>
      </header>
      <main className="detail-layout">
        <aside className="context-sidebar">
          <section><span className="eyebrow">Ticket info</span><dl><div><dt>Status</dt><dd><StatusPill value={resolved ? 'Resolved' : ticket.status} /></dd></div><div><dt>Urgency</dt><dd className="priority priority-high"><i />{ticket.priority}</dd></div><div><dt>Category</dt><dd>{ticket.category}</dd></div><div><dt>Queue</dt><dd>Tier 1 Support</dd></div></dl></section>
          <section><span className="eyebrow">SLA Monitor</span><div className="panel sla-monitor"><div><span>First response</span><b className="lime-text">Passed</b></div><div><span>Next reply</span><b className="gold-text">14m left</b></div><div className="progress"><i style={{ width: '68%' }} /></div></div></section>
          <section><span className="eyebrow">Internal tags</span><div className="tags"><span>#northwind_io</span><span>#refund_v2</span><span>#stripe_issue</span></div></section>
        </aside>

        <section className="conversation">
          <div className="conversation-scroll">
            <div className="message user-message"><Avatar initials="MV" tone="pink" size="lg" /><div><div className="message-meta"><b>Mara Velasquez</b><span>2 hours ago</span></div><p>Hi Support team, I’m trying to process a refund for order #NV-4481 but I keep getting an “Internal API Error” when I click confirm. Can you look into this? The customer is quite frustrated.</p><button className="attachment"><FileText size={15} /> order_details.pdf</button></div></div>
            <div className="message agent-message"><Avatar initials="AR" tone="blue" size="lg" /><div><div className="message-meta"><span>45 minutes ago</span><b>Alex Rivera <em>Agent</em></b></div><p>Hello Mara! I’m sorry about the trouble. I checked our billing logs and found a temporary sync issue with the Stripe gateway for that order range. I’m escalating this to our Tier 2 team now.</p></div></div>
            <div className="note-divider"><i /><span>Internal note added</span><i /></div>
            <div className="internal-note"><LockKeyhole size={17} /><p><b>Note by Alex Rivera:</b> Mara is a high-value account admin. Escalated to Tier 2 (Devon) to check the gateway timeout logs.</p></div>
            {messages.map((item, index) => item.mode === 'note' ? <div className="internal-note" key={index}><LockKeyhole size={17} /><p><b>Note by Alex Rivera:</b> {item.body}</p></div> : <div className="message agent-message" key={index}><Avatar initials="AR" tone="blue" size="lg" /><div><div className="message-meta"><span>Just now</span><b>Alex Rivera <em>Agent</em></b></div><p>{item.body}</p></div></div>)}
          </div>
          <div className="reply-area"><div className="panel composer"><div className="composer-tabs"><button className={mode === 'reply' ? 'active' : ''} onClick={() => setMode('reply')}>Reply to user</button><button className={mode === 'note' ? 'active note' : ''} onClick={() => setMode('note')}>Internal note</button></div><textarea rows="3" value={message} onChange={e => setMessage(e.target.value)} placeholder={mode === 'reply' ? 'Type your message…' : 'Add a private note for your team…'} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendMessage() }} /><div className="composer-actions"><div><button><Paperclip size={17} /></button><button><Smile size={17} /></button><button><Bolt size={17} /></button></div><button className={mode === 'note' ? 'note-send' : ''} onClick={sendMessage}><Send size={15} />{mode === 'reply' ? 'Send reply' : 'Add note'}</button></div></div></div>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-head"><Avatar initials="MV" tone="pink" size="xl" /><h2>Mara Velasquez</h2><p>Account Administrator · Northwind IO</p><div><button><Mail size={16} /></button><button><Phone size={16} /></button><button><ExternalLink size={16} /></button></div></section>
          <section><span className="eyebrow">Customer health</span><div className="panel health-card"><span>Sentiment score</span><strong>8.4 <small>/ 10</small></strong><div className="progress"><i style={{ width: '84%' }} /></div></div><div className="profile-stats"><div><span>Open</span><strong>1</strong></div><div><span>Resolved</span><strong>14</strong></div></div></section>
          <section><span className="eyebrow">Technical context</span><dl className="technical"><div><dt>Browser</dt><dd>Chrome 122.0</dd></div><div><dt>OS</dt><dd>macOS 14.3.1</dd></div><div><dt>Account ID</dt><dd>AC-9921-X</dd></div><div><dt>Plan</dt><dd className="cyan-text">Enterprise</dd></div></dl></section>
        </aside>
      </main>
    </div>
  )
}
