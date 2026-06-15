import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

export async function signUp({ email, password, fullName, orgName }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  if (authError) throw authError

  const { data, error } = await supabase.rpc('create_org_and_profile', {
    org_name: orgName,
    user_id: authData.user.id,
    full_name: fullName
  })
  if (error) throw error

  return authData
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, orgs(name)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function uploadCardImage(orgId, file, side) {
  const ext = file.name.split('.').pop()
  const path = `${orgId}/${Date.now()}-${side}.${ext}`
  const { error } = await supabase.storage.from('card-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('card-images').getPublicUrl(path)
  return data.publicUrl
}
