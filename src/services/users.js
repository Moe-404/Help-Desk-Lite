import { supabase } from '../lib/supabase'

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function setUserRole(userId, role) {
  const { data, error } = await supabase.rpc('set_user_role', { target_user_id: userId, new_role: role })
  if (error) throw error
  return data
}
