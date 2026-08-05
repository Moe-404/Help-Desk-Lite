import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, Clock3, CloudUpload, FileText, Lightbulb, Send, X } from 'lucide-react'
import Avatar from '../components/Avatar'
import Brand from '../components/Brand'
import { createTicket, isSupabaseConfigured, uploadTicketAttachment } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'

const articles = [
  ['How to reset your password', 'Quick guide to self-service password recovery.', 'Open the sign-in page, choose “Forgot password,” and follow the link sent to your company email. Contact support if the email does not arrive within five minutes.'],
  ['VPN connection issues', 'Common troubleshooting steps for remote access.', 'Disconnect the VPN, confirm your internet connection, restart the VPN client, and sign in again. Include the exact error message if the problem continues.'],
  ['Software request policy', 'Approval steps and supported applications.', 'Submit the software name, business purpose, device, and manager approval. IT will confirm licensing and security requirements before installation.'],
]

export default function SubmitTicket() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const fileRef = useRef(null)
  const [priority, setPriority] = useState('Medium')
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(searchParams.get('knowledge') ? articles[0][0] : '')
  const [form, setForm] = useState({ requesterName: profile?.full_name || '', requesterEmail: profile?.email || '', category: 'Technical Issue', subject: '', description: '' })

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const selectFile = selected => {
    if (!selected) return
    const allowed = ['image/png', 'image/jpeg', 'application/pdf']
    if (!allowed.includes(selected.type)) {
      setSubmitError('Choose a PNG, JPG, or PDF file.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setSubmitError('Attachments must be 10MB or smaller.')
      return
    }
    setSubmitError('')
    setFile(selected)
  }

  const resetForm = () => {
    setForm(current => ({ ...current, subject: '', description: '' }))
    setFile(null)
    setSubmittedTicket(null)
    setSubmitted(false)
  }
  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const ticket = await createTicket({ ...form, priority })
      if (file && isSupabaseConfigured) await uploadTicketAttachment(ticket.id, file)
      setSubmittedTicket(ticket)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return (
    <div className="submit-page success-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="success-card panel">
        <div className="success-icon"><Check size={34} /></div>
        <span className="eyebrow cyan-text">Request received</span>
        <h1>Your ticket is on its way</h1>
        <p>We’ve created <strong>#{submittedTicket?.id}</strong>{isSupabaseConfigured ? ' and saved it to Supabase' : ' in demo mode'}. Average first response is currently about 12 minutes.</p>
        <div className="success-details"><span><b>{form.subject}</b><small>{form.category} · {priority} priority</small></span><span className="pill pill-open">Open</span></div>
        <div className="success-actions"><button className="secondary-button" onClick={() => navigate('/')}><ArrowLeft size={16} /> Dashboard</button><button className="primary-button" onClick={resetForm}>Submit another</button></div>
      </div>
    </div>
  )

  return (
    <div className="submit-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="simple-header"><button className="brand-button" onClick={() => navigate('/')}><Brand /></button><div><button className="text-button" onClick={() => navigate('/')}>My Tickets</button><Avatar initials="JD" tone="blue" /></div></header>
      <main className="submit-layout">
        <section className="form-column">
          <button className="back-link" onClick={() => navigate('/')}><ArrowLeft size={15} /> Back to workspace</button>
          <div className="form-title"><span className="eyebrow cyan-text">New support request</span><h1>How can we help?</h1><p>Tell us what’s happening and our team will get back to you shortly.</p></div>
          <form className="panel ticket-form" onSubmit={submit}>
            <div className="form-grid">
              <label className="field"><span>Your name</span><input required readOnly name="requesterName" value={form.requesterName} onChange={update} placeholder="Your full name" /></label>
              <label className="field"><span>Email</span><input required readOnly type="email" name="requesterEmail" value={form.requesterEmail} onChange={update} placeholder="you@company.com" /></label>
            </div>
            <div className="form-grid">
              <label className="field"><span>Category</span><select name="category" value={form.category} onChange={update}><option>Technical Issue</option><option>Billing & Access</option><option>Feature Request</option><option>General Inquiry</option></select></label>
              <fieldset className="field"><legend>Priority</legend><div className="priority-buttons">{['Low', 'Medium', 'High'].map(value => <button type="button" key={value} className={priority === value ? 'active' : ''} onClick={() => setPriority(value)}>{value}</button>)}</div></fieldset>
            </div>
            <label className="field"><span>Subject</span><input required name="subject" value={form.subject} onChange={update} placeholder="Brief summary of your request" /></label>
            <label className="field"><span>Description</span><textarea required minLength="10" name="description" value={form.description} onChange={update} rows="6" placeholder="Please provide as much detail as possible..." /><small>{form.description.length}/1000</small></label>
            <div className="field"><span>Attachments <em>Optional</em></span>{!file ? <button className="dropzone" type="button" onClick={() => fileRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectFile(e.dataTransfer.files[0]) }}><i><CloudUpload size={23} /></i><b>Click to upload <span>or drag and drop</span></b><small>PNG, JPG, or PDF up to 10MB</small></button> : <div className="file-chip"><FileText size={20} /><span><b>{file.name}</b><small>{Math.ceil(file.size / 1024)} KB</small></span><button type="button" onClick={() => setFile(null)}><X size={16} /></button></div>}<input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,application/pdf" onChange={e => selectFile(e.target.files[0])} /></div>
            {submitError && <div className="form-error">{submitError}</div>}
            <button className="rainbow-button" type="submit" disabled={submitting}><Send size={17} /> {submitting ? 'Submitting…' : 'Submit Request'}</button>
          </form>
        </section>
        <aside className="help-column">
          <article className="panel quick-help"><div className="help-icon"><Lightbulb size={20} /></div><h2>Quick Help</h2><p>You might find your answer here.</p><div>{articles.map(([title, body, answer]) => <div className="help-article" key={title}><button onClick={() => setSelectedArticle(current => current === title ? '' : title)}><span><b>{title}</b><small>{body}</small></span><ChevronRight size={16} /></button>{selectedArticle === title && <p className="article-answer">{answer}</p>}</div>)}</div><button className="secondary-button full" onClick={() => setSelectedArticle(selectedArticle ? '' : articles[0][0])}>{selectedArticle ? 'Close article' : 'Browse Knowledge Base'}</button></article>
          <article className="panel response-card"><i><Clock3 size={20} /></i><span><small>Average response time</small><strong>~ 12 minutes</strong><em><span className="live-pulse" /> Support is online</em></span></article>
          <p className="privacy-note">Your request is only visible to you and the internal support team.</p>
        </aside>
      </main>
      <footer className="site-footer">© 2026 HelpDesk Lite · Internal Support System</footer>
    </div>
  )
}
