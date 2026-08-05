import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bolt, CheckCheck, ExternalLink, FileText, LockKeyhole, Mail, Paperclip, Phone, Send, Smile, UserPlus } from 'lucide-react'
import Avatar from '../components/Avatar'
import StatusPill from '../components/StatusPill'
import { createMessage, downloadAttachment, getTicket, isSupabaseConfigured, listAttachments, listMessages, updateTicket, uploadTicketAttachment } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'
import { can, isStaff } from '../auth/permissions'

export default function TicketDetails() {
  const navigate = useNavigate()
  const { user, profile, role } = useAuth()
  const staff = isStaff(role)
  const { ticketId } = useParams()
  const fileRef = useRef(null)
  const [ticket, setTicket] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [assigned, setAssigned] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [mode, setMode] = useState('reply')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [attachments, setAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getTicket(ticketId), listMessages(ticketId), listAttachments(ticketId)])
      .then(([ticketData, messageData, attachmentData]) => {
        if (!active) return
        if (!ticketData) throw new Error(`Ticket ${ticketId} was not found.`)
        setTicket(ticketData)
        setMessages(messageData)
        setAttachments(attachmentData)
        setAssigned(Boolean(ticketData.assignedTo))
        setResolved(ticketData.status === 'Resolved')
      })
      .catch(error => active && setLoadError(error.message))
    return () => { active = false }
  }, [ticketId])

  const assignTicket = async () => {
    setAssigned(true)
    if (!isSupabaseConfigured) return
    try {
      const updated = await updateTicket(ticket.id, { assignedTo: profile.full_name, status: ticket.status === 'Open' ? 'In Progress' : ticket.status })
      setTicket(updated)
    } catch (error) {
      setAssigned(false)
      setLoadError(error.message)
    }
  }

  const resolveTicket = async () => {
    setResolved(true)
    if (!isSupabaseConfigured) return
    try {
      const updated = await updateTicket(ticket.id, { status: 'Resolved' })
      setTicket(updated)
    } catch (error) {
      setResolved(false)
      setLoadError(error.message)
    }
  }

  const sendMessage = async () => {
    if (!message.trim()) return
    const body = message.trim()
    setSending(true)
    try {
      const saved = isSupabaseConfigured
        ? await createMessage(ticket.id, body, mode === 'note' ? 'note' : 'reply', { id: user.id, name: profile.full_name, isStaff: staff })
        : { id: crypto.randomUUID(), body, kind: mode === 'note' ? 'note' : 'reply', author_name: profile.full_name, author_role: staff ? 'agent' : 'requester', created_at: new Date().toISOString() }
      setMessages(current => [...current, saved])
      setMessage('')
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setSending(false)
    }
  }

  const attachFile = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setLoadError('Attachments must be 10MB or smaller.')
      return
    }
    if (!isSupabaseConfigured) {
      setLoadError('Connect Supabase before uploading ticket attachments.')
      return
    }
    setUploading(true)
    setLoadError('')
    try {
      const attachment = await uploadTicketAttachment(ticket.id, file)
      setAttachments(current => [...current, attachment])
      setNotice('Attachment uploaded')
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const copyTicketLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setNotice('Ticket link copied')
  }

  if (loadError && !ticket) return <div className="details-page"><div className="empty-state"><b>Could not load ticket</b><span>{loadError}</span><button className="secondary-button" onClick={() => navigate('/')}>Back to dashboard</button></div></div>
  if (!ticket) return <div className="details-page"><div className="empty-state"><b>Loading ticket…</b></div></div>

  return (
    <div className="details-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="detail-header">
        <div><button className="icon-button" onClick={() => navigate('/')}><ArrowLeft size={19} /></button><i /><h1><span>#{ticket.id}</span><b>{ticket.subject}</b></h1></div>
        {can(role, 'tickets:update') && <div><button className="secondary-button" onClick={assignTicket} disabled={assigned}>{assigned ? <CheckCheck size={15} /> : <UserPlus size={15} />}{assigned ? 'Assigned to you' : 'Assign to me'}</button><button className="resolve-button" disabled={resolved} onClick={resolveTicket}><CheckCheck size={16} />{resolved ? 'Resolved' : 'Resolve Ticket'}</button></div>}
      </header>
      <main className="detail-layout">
        <aside className="context-sidebar">
          <section><span className="eyebrow">Ticket info</span><dl><div><dt>Status</dt><dd><StatusPill value={resolved ? 'Resolved' : ticket.status} /></dd></div><div><dt>Urgency</dt><dd className="priority priority-high"><i />{ticket.priority}</dd></div><div><dt>Category</dt><dd>{ticket.category}</dd></div><div><dt>Queue</dt><dd>Tier 1 Support</dd></div></dl></section>
          <section><span className="eyebrow">SLA Monitor</span><div className="panel sla-monitor"><div><span>First response</span><b className="lime-text">Passed</b></div><div><span>Next reply</span><b className="gold-text">14m left</b></div><div className="progress"><i style={{ width: '68%' }} /></div></div></section>
          <section><span className="eyebrow">Internal tags</span><div className="tags"><span>#northwind_io</span><span>#refund_v2</span><span>#stripe_issue</span></div></section>
        </aside>

        <section className="conversation">
          <div className="conversation-scroll">
            <div className="message user-message"><Avatar initials={ticket.initials} tone={ticket.tone} size="lg" /><div><div className="message-meta"><b>{ticket.requester}</b><span>Original request</span></div><p>{ticket.description || 'Please help me resolve this request.'}</p>{!isSupabaseConfigured && <button className="attachment"><FileText size={15} /> order_details.pdf</button>}</div></div>
            {!isSupabaseConfigured && <div className="message agent-message"><Avatar initials="AR" tone="blue" size="lg" /><div><div className="message-meta"><span>45 minutes ago</span><b>Alex Rivera <em>Agent</em></b></div><p>Thanks for the details. I’m looking into this request and will share an update shortly.</p></div></div>}
            {attachments.length > 0 && <div className="internal-note"><Paperclip size={17} /><p><b>Attachments:</b> {attachments.map(attachment => <button className="attachment" key={attachment.id} onClick={() => downloadAttachment(attachment).catch(error => setLoadError(error.message))}><FileText size={15} /> {attachment.file_name}</button>)}</p></div>}
            {messages.map(item => item.kind === 'note' ? <div className="internal-note" key={item.id}><LockKeyhole size={17} /><p><b>Note by {item.author_name}:</b> {item.body}</p></div> : <div className={item.author_role === 'requester' ? 'message user-message' : 'message agent-message'} key={item.id}><Avatar initials={item.author_role === 'requester' ? ticket.initials : 'AR'} tone={item.author_role === 'requester' ? ticket.tone : 'blue'} size="lg" /><div><div className="message-meta"><span>{new Date(item.created_at).toLocaleString()}</span><b>{item.author_name}{item.author_role === 'agent' && <em>Agent</em>}</b></div><p>{item.body}</p></div></div>)}
          </div>
          <div className="reply-area"><div className="panel composer"><div className="composer-tabs"><button className={mode === 'reply' ? 'active' : ''} onClick={() => setMode('reply')}>{staff ? 'Reply to user' : 'Reply to support'}</button>{can(role, 'messages:note') && <button className={mode === 'note' ? 'active note' : ''} onClick={() => setMode('note')}>Internal note</button>}</div><textarea rows="3" value={message} onChange={e => setMessage(e.target.value)} placeholder={mode === 'reply' ? 'Type your message…' : 'Add a private note for your team…'} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendMessage() }} /><div className="composer-actions"><div><button title="Attach a file" onClick={() => fileRef.current?.click()} disabled={uploading}><Paperclip size={17} /></button><button title="Add emoji" onClick={() => setMessage(current => `${current}${current ? ' ' : ''}🙂`)}><Smile size={17} /></button><button title="Insert quick response" onClick={() => setMessage(staff ? 'Thanks for the details. I’m reviewing this now and will update you shortly.' : 'Here is some additional information that may help with my request: ')}><Bolt size={17} /></button></div><button className={mode === 'note' ? 'note-send' : ''} onClick={sendMessage} disabled={sending || !message.trim()}><Send size={15} />{sending ? 'Saving…' : mode === 'reply' ? 'Send reply' : 'Add note'}</button></div><input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,application/pdf" onChange={attachFile} /></div>{loadError && <div className="form-error">{loadError}</div>}</div>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-head"><Avatar initials={ticket.initials} tone={ticket.tone} size="xl" /><h2>{ticket.requester}</h2><p>{ticket.requesterEmail || 'Account Administrator · Northwind IO'}</p><div>{staff && <button title="Email requester" onClick={() => { window.location.href = `mailto:${ticket.requesterEmail}?subject=${encodeURIComponent(ticket.id)}` }} disabled={!ticket.requesterEmail}><Mail size={16} /></button>}{staff && <button title="Phone number unavailable" disabled><Phone size={16} /></button>}<button title="Copy ticket link" onClick={() => copyTicketLink().catch(error => setLoadError(error.message))}><ExternalLink size={16} /></button></div></section>
          <section><span className="eyebrow">Customer health</span><div className="panel health-card"><span>Sentiment score</span><strong>8.4 <small>/ 10</small></strong><div className="progress"><i style={{ width: '84%' }} /></div></div><div className="profile-stats"><div><span>Open</span><strong>1</strong></div><div><span>Resolved</span><strong>14</strong></div></div></section>
          {staff && <section><span className="eyebrow">Technical context</span><dl className="technical"><div><dt>Browser</dt><dd>Chrome 122.0</dd></div><div><dt>OS</dt><dd>macOS 14.3.1</dd></div><div><dt>Account ID</dt><dd>AC-9921-X</dd></div><div><dt>Plan</dt><dd className="cyan-text">Enterprise</dd></div></dl></section>}
        </aside>
      </main>
      {notice && <div className="app-toast" role="status">{notice}</div>}
    </div>
  )
}
