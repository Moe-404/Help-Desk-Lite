import { useEffect, useState } from 'react'
import { ArrowLeft, Shield, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { roleLabels } from '../auth/permissions'
import Avatar from '../components/Avatar'
import { listProfiles, setUserRole } from '../services/users'

const roles = ['admin', 'manager', 'agent', 'requester']

export default function AdminUsers() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')

  const load = async () => {
    try { setProfiles(await listProfiles()); setError('') } catch (loadError) { setError(loadError.message) }
  }
  useEffect(() => { load() }, [])

  const changeRole = async (id, role) => {
    setSaving(id)
    try { await setUserRole(id, role); await load() } catch (saveError) { setError(saveError.message) } finally { setSaving('') }
  }

  return <div className="admin-page"><header className="detail-header"><div><button className="icon-button" onClick={() => navigate('/')}><ArrowLeft size={19} /></button><i /><h1><span><Shield size={15} /></span><b>User roles and access</b></h1></div></header><main className="admin-content"><section className="page-intro"><div><span className="eyebrow cyan-text">Administration</span><h1>Workspace members</h1><p>Roles are enforced by Postgres Row Level Security, not only hidden in the interface.</p></div></section>{error && <div className="form-error">{error}</div>}<section className="panel users-panel"><div className="panel-heading"><div><h2><Users size={17} /> Members</h2><p>{profiles.length} accounts</p></div></div>{profiles.map(profile => <div className="user-row" key={profile.id}><Avatar initials={profile.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()} tone="purple" /><span><b>{profile.full_name}</b><small>{profile.email}</small></span><select value={profile.role} disabled={profile.id === user.id || saving === profile.id} onChange={event => changeRole(profile.id, event.target.value)} aria-label={`Role for ${profile.full_name}`}>{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></div>)}</section></main></div>
}
