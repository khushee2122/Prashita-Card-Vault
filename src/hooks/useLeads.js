import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const LEAD_COLUMNS = new Set([
  'exhibition_id',
  'company_name',
  'contact_person',
  'mobile',
  'email',
  'address',
  'designation',
  'city',
  'state',
  'country',
  'website',
  'company_context',
  'lead_type',
  'notes',
  'card_front_url',
  'card_back_url'
])

function cleanLeadPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).filter(([key]) => LEAD_COLUMNS.has(key))
  )
}

export function useLeads(exhibitionId = null) {
  const { profile } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    if (!profile?.org_id) return
    setLoading(true)
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          exhibitions!leads_exhibition_id_fkey(name),
          profiles(full_name)
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })

      if (exhibitionId) query = query.eq('exhibition_id', exhibitionId)

      const { data, error: err } = await query
      if (err) throw err
      setLeads(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.org_id, exhibitionId])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Realtime subscription
  useEffect(() => {
    if (!profile?.org_id) return

    const channel = supabase
      .channel(`leads-${profile.org_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `org_id=eq.${profile.org_id}`
      }, () => {
        fetchLeads()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.org_id, fetchLeads])

  async function addLead(leadData) {
    const { data, error: err } = await supabase
      .from('leads')
      .insert({
        ...cleanLeadPayload(leadData),
        org_id: profile.org_id,
        scanned_by: profile.id
      })
      .select()
      .single()
    if (err) throw err
    return data
  }

  async function updateLead(id, updates) {
    const { data, error: err } = await supabase
      .from('leads')
      .update(cleanLeadPayload(updates))
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .select()
      .single()
    if (err) throw err
    return data
  }

  async function deleteLead(id) {
    const { error: err } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('org_id', profile.org_id)
    if (err) throw err
  }

  return { leads, loading, error, refetch: fetchLeads, addLead, updateLead, deleteLead }
}

export function useExhibitions() {
  const { profile } = useAuth()
  const [exhibitions, setExhibitions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchExhibitions = useCallback(async () => {
    if (!profile?.org_id) return
    const { data, error } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
    if (!error) setExhibitions(data || [])
    setLoading(false)
  }, [profile?.org_id])

  useEffect(() => { fetchExhibitions() }, [fetchExhibitions])

  // Realtime
  useEffect(() => {
    if (!profile?.org_id) return
    const channel = supabase
      .channel(`exhibitions-${profile.org_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exhibitions', filter: `org_id=eq.${profile.org_id}` }, fetchExhibitions)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile?.org_id, fetchExhibitions])

  async function createExhibition(data) {
    const { data: exh, error } = await supabase
      .from('exhibitions')
      .insert({ ...data, org_id: profile.org_id })
      .select()
      .single()
    if (error) throw error
    return exh
  }

  async function updateExhibition(id, updates) {
    const { error } = await supabase
      .from('exhibitions')
      .update(updates)
      .eq('id', id)
      .eq('org_id', profile.org_id)
    if (error) throw error
  }

  async function archiveExhibition(id) {
    return updateExhibition(id, { status: 'archived' })
  }

  return { exhibitions, loading, refetch: fetchExhibitions, createExhibition, updateExhibition, archiveExhibition }
}

export function useTeam() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchTeam() {
    if (!profile?.org_id) return
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase.from('profiles').select('*').eq('org_id', profile.org_id).order('created_at'),
      supabase.from('invites').select('*').eq('org_id', profile.org_id).eq('accepted', false).order('created_at', { ascending: false })
    ])
    setMembers(m || [])
    setInvites(i || [])
    setLoading(false)
  }

  useEffect(() => { fetchTeam() }, [profile?.org_id])

  async function inviteMember(email) {
    const { error } = await supabase
      .from('invites')
      .insert({ org_id: profile.org_id, email: email.toLowerCase().trim(), invited_by: profile.id })
    if (error) throw error
    await fetchTeam()
  }

  async function removeMember(memberId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId)
      .eq('org_id', profile.org_id)
    if (error) throw error
    await fetchTeam()
  }

  return { members, invites, loading, refetch: fetchTeam, inviteMember, removeMember }
}
