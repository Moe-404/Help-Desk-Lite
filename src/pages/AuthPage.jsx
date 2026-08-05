import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { KeyRound, LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import Brand from '../components/Brand'
import { useAuth } from '../auth/AuthContext'

export default function AuthPage() {
  const { user, signIn, signUp, authError } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))

  if (user) return <Navigate to={location.state?.from || '/'} replace />

  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      if (mode === 'signin') await signIn(form.email, form.password)
      else {
        const data = await signUp(form.fullName, form.email, form.password)
        if (!data.session) setMessage('Account created. Check your email to confirm your address, then sign in.')
      }
    } catch {
      // The context exposes a safe user-facing error.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <main className="panel auth-card">
        <Brand />
        <div className="auth-icon"><ShieldCheck size={24} /></div>
        <span className="eyebrow cyan-text">Secure workspace</span>
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p>{mode === 'signin' ? 'Sign in to access the tickets permitted for your role.' : 'New accounts start with the requester role.'}</p>
        <div className="auth-tabs"><button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}><LogIn size={15} /> Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}><UserPlus size={15} /> Sign up</button></div>
        <form onSubmit={submit}>
          {mode === 'signup' && <label className="field"><span>Full name</span><input required name="fullName" value={form.fullName} onChange={update} autoComplete="name" /></label>}
          <label className="field"><span>Email</span><input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" /></label>
          <label className="field"><span>Password</span><input required minLength="8" type="password" name="password" value={form.password} onChange={update} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
          {(authError || message) && <div className={authError ? 'form-error' : 'auth-message'}>{authError || message}</div>}
          <button className="rainbow-button" disabled={submitting}><KeyRound size={16} /> {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
      </main>
    </div>
  )
}
