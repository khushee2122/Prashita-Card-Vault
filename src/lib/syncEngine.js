// ── Sync Engine ───────────────────────────────────────────────
// Watches network status and syncs pending leads to Supabase

import { supabase, uploadCardImage } from './supabase'
import { getPendingLeads, markSynced, incrementAttempts } from './offlineQueue'

let syncInProgress = false
let onSyncUpdate = null // callback to update UI

export function setSyncCallback(cb) {
  onSyncUpdate = cb
}

// Try to sync one lead to Supabase
async function syncOneLead(record) {
  try {
    const { lead } = record

    // Upload card images if they exist as blobs
    let card_front_url = lead.card_front_url
    let card_back_url = lead.card_back_url

    // Insert the lead
    const { error } = await supabase.from('leads').insert({
      company_name:    lead.company_name,
      contact_person:  lead.contact_person,
      mobile:          lead.mobile,
      email:           lead.email,
      address:         lead.address,
      designation:     lead.designation,
      city:            lead.city,
      state:           lead.state,
      country:         lead.country,
      website:         lead.website,
      company_context: lead.company_context,
      lead_type:       lead.lead_type,
      notes:           lead.notes,
      exhibition_id:   lead.exhibition_id,
      org_id:          lead.org_id,
      scanned_by:      lead.scanned_by,
      card_front_url,
      card_back_url,
    })

    if (error) throw error
    await markSynced(record.local_id)
    return true
  } catch (err) {
    await incrementAttempts(record.local_id)
    return false
  }
}

// Run full sync — called when network comes back
export async function runSync() {
  if (syncInProgress) return
  if (!navigator.onLine) return

  syncInProgress = true
  try {
    const pending = await getPendingLeads()
    if (pending.length === 0) { syncInProgress = false; return }

    let synced = 0
    for (const record of pending) {
      const success = await syncOneLead(record)
      if (success) synced++
      if (onSyncUpdate) onSyncUpdate(await getPendingLeads().then(p => p.length))
    }

    if (onSyncUpdate) onSyncUpdate(0)
  } finally {
    syncInProgress = false
  }
}

// Start watching network — call once on app load
export function startSyncWatcher() {
  window.addEventListener('online', () => {
    setTimeout(runSync, 1000) // small delay to let connection stabilise
  })

  // Also try syncing on load in case we're already online
  if (navigator.onLine) {
    setTimeout(runSync, 2000)
  }
}
