import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const CARD_IMAGES_BUCKETS = ['card-images', 'Card-images']

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

export async function signUp({ email, password, fullName, orgName }) {
  const cleanEmail = email.toLowerCase().trim()

  // 1. Check for pending invite — use maybeSingle() to avoid error when no row found
  const { data: invite } = await supabase
    .from('invites')
    .select('org_id')
    .eq('email', cleanEmail)
    .eq('accepted', false)
    .maybeSingle()

  // 2. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { full_name: fullName } }
  })
  if (authError) throw authError

  const userId = authData.user.id

  if (invite?.org_id) {
    // 3a. Invite found — join existing org as member
    const { error } = await supabase.rpc('create_org_and_profile', {
      org_name: null,
      user_id: userId,
      full_name: fullName,
      existing_org_id: invite.org_id,
      user_role: 'member'
    })
    if (error) throw error

    // Mark invite as accepted
    await supabase
      .from('invites')
      .update({ accepted: true })
      .eq('email', cleanEmail)

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
  try {
    let lastError = null

    for (const bucket of CARD_IMAGES_BUCKETS) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type || 'image/jpeg' })

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        return data.publicUrl
      }

      lastError = error
      if (!/bucket/i.test(error.message || '')) throw error
    }

    throw lastError
  } catch (error) {
    throw new Error(error?.message === 'Load failed'
      ? 'Could not upload the card photo. Please check your connection and try again.'
      : error?.message || 'Could not upload the card photo.')
  }
}
