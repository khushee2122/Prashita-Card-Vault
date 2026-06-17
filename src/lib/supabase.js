import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env variables. Copy .env.example to .env.local and fill in your credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

export async function signUp({ email, password, fullName, orgName }) {
  // 1. Check if this email has a pending invite
  const { data: invite } = await supabase
    .from('invites')
    .select('org_id')
    .eq('email', email.toLowerCase().trim())
    .eq('accepted', false)
    .single()

  // 2. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  if (authError) throw authError

  const userId = authData.user.id

  if (invite) {
    // 3a. Invite found — join existing org as member
    const { error: profileError } = await supabase.rpc('create_org_and_profile', {
      org_name: null,
      user_id: userId,
      full_name: fullName,
      existing_org_id: invite.org_id,
      user_role: 'member'
    })
    if (profileError) throw profileError

    // Mark invite as accepted
    await supabase
      .from('invites')
      .update({ accepted: true })
      .eq('email', email.toLowerCase().trim())

  } else {
    // 3b. No invite — create new org as admin
    const { error } = await supabase.rpc('create_org_and_profile', {
      org_name: orgName,
      user_id: userId,
      full_name: fullName,
      existing_org_id: null,
      user_role: 'admin'
    })
    if (error) throw error
  }

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
  const { error } = await supabase.storage.from('Card-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('Card-images').getPublicUrl(path)
  return data.publicUrl
}
