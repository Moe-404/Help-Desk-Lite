import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, Clock3, CloudUpload, FileText, Lightbulb, Send, X } from 'lucide-react'
import Avatar from '../components/Avatar'
import Brand from '../components/Brand'

const articles = [
  ['How to reset your password', 'Quick guide to self-service password recovery.'],
  ['VPN connection issues', 'Common troubleshooting steps for remote access.'],
  ['Software request policy', 'Approval steps and supported applications.'],
]

export default function SubmitTicket() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [priority, setPriority] = useState('Medium')
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ category: 'Technical Issue', subject: '', description: '' })

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const submit = event => {
    event.preventDefault()
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="submit-page success-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="success-card panel">
        <div className="success-icon"><Check size={34} /></div>
        <span className="eyebrow cyan-text">Request received</span>
        <h1>Your ticket is on its way</h1>
        <p>We’ve created <strong>#HD-1025</strong> and notified the support team. Average first response is currently about 12 minutes.</p>
        <div className="success-details"><span><b>{form.subject}</b><small>{form.category} · {priority} priority</small></span><span className="pill pill-open">Open</span></div>
        <div className="success-actions"><button className="secondary-button" onClick={() => navigate('/')}><ArrowLeft size={16} /> Dashboard</button><button className="primary-button" onClick={() => setSubmitted(false)}>Submit another</button></div>
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
              <label className="field"><span>Category</span><select name="category" value={form.category} onChange={update}><option>Technical Issue</option><option>Billing & Access</option><option>Feature Request</option><option>General Inquiry</option></select></label>
              <fieldset className="field"><legend>Priority</legend><div className="priority-buttons">{['Low', 'Medium', 'High'].map(value => <button type="button" key={value} className={priority === value ? 'active' : ''} onClick={() => setPriority(value)}>{value}</button>)}</div></fieldset>
            </div>
            <label className="field"><span>Subject</span><input required name="subject" value={form.subject} onChange={update} placeholder="Brief summary of your request" /></label>
            <label className="field"><span>Description</span><textarea required minLength="10" name="description" value={form.description} onChange={update} rows="6" placeholder="Please provide as much detail as possible..." /><small>{form.description.length}/1000</small></label>
            <div className="field"><span>Attachments <em>Optional</em></span>{!file ? <button className="dropzone" type="button" onClick={() => fileRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}><i><CloudUpload size={23} /></i><b>Click to upload <span>or drag and drop</span></b><small>PNG, JPG, or PDF up to 10MB</small></button> : <div className="file-chip"><FileText size={20} /><span><b>{file.name}</b><small>{Math.ceil(file.size / 1024)} KB</small></span><button type="button" onClick={() => setFile(null)}><X size={16} /></button></div>}<input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,application/pdf" onChange={e => setFile(e.target.files[0])} /></div>
            <button className="rainbow-button" type="submit"><Send size={17} /> Submit Request</button>
          </form>
        </section>
        <aside className="help-column">
          <article className="panel quick-help"><div className="help-icon"><Lightbulb size={20} /></div><h2>Quick Help</h2><p>You might find your answer here.</p><div>{articles.map(([title, body]) => <button key={title}><span><b>{title}</b><small>{body}</small></span><ChevronRight size={16} /></button>)}</div><button className="secondary-button full">Browse Knowledge Base</button></article>
          <article className="panel response-card"><i><Clock3 size={20} /></i><span><small>Average response time</small><strong>~ 12 minutes</strong><em><span className="live-pulse" /> Support is online</em></span></article>
          <p className="privacy-note">Your request is only visible to you and the internal support team.</p>
        </aside>
      </main>
      <footer className="site-footer">© 2026 HelpDesk Lite · Internal Support System</footer>
    </div>
  )
}
