import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env variables. Copy .env.example to .env.local and fill in your credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// ── Auth helpers ──────────────────────────────────────────────

export async function signUp({ email, password, fullName, orgName }) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  if (authError) throw authError

  const userId = authData.user.id

  // 2. Create org
  const { data: orgData, error: orgError } = await supabase
    .from('orgs')
    .insert({ name: orgName })
    .select()
    .single()
  if (orgError) throw orgError

  // 3. Create profile (admin)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: userId, org_id: orgData.id, full_name: fullName, role: 'admin' })
  if (profileError) throw profileError

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

// ── Storage helpers ───────────────────────────────────────────

export async function uploadCardImage(orgId, file, side) {
  const ext = file.name.split('.').pop()
  const path = `${orgId}/${Date.now()}-${side}.${ext}`
  const { error } = await supabase.storage.from('card-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('card-images').getPublicUrl(path)
  return data.publicUrl
}
