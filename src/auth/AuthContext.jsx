import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const demoProfile = { id: 'demo-user', email: 'alex@example.com', full_name: 'Alex Rivera', role: 'admin' }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(isSupabaseConfigured ? null : { user: { id: demoProfile.id, email: demoProfile.email } })
  const [profile, setProfile] = useState(isSupabaseConfigured ? null : demoProfile)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')

  const loadProfile = async user => {
    if (!user) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    setProfile(data)
    return data
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      setSession(currentSession)
      if (currentSession?.user) {
        try { await loadProfile(currentSession.user) } catch (profileError) { setAuthError(profileError.message) }
      }
      if (active) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      window.setTimeout(async () => {
        try {
          if (nextSession?.user) await loadProfile(nextSession.user)
          else setProfile(null)
        } catch (error) {
          setAuthError(error.message)
        } finally {
          setLoading(false)
        }
      }, 0)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  const signUp = async (fullName, email, password) => {
    setAuthError('')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) {
      setAuthError(error.message)
      throw error
    }
    return data
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = () => session?.user ? loadProfile(session.user) : Promise.resolve(null)

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [session, profile, loading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
