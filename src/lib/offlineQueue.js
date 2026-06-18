// ── Offline Queue Manager using IndexedDB ─────────────────────
const DB_NAME = 'cardvault_offline'
const DB_VERSION = 2
const LEADS_STORE = 'pending_leads'
const EXHIBITIONS_STORE = 'cached_exhibitions'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(LEADS_STORE)) {
        db.createObjectStore(LEADS_STORE, { keyPath: 'local_id' })
      }
      if (!db.objectStoreNames.contains(EXHIBITIONS_STORE)) {
        db.createObjectStore(EXHIBITIONS_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = e => resolve(e.target.result)
    request.onerror = () => reject(request.error)
  })
}

// ── Leads queue ───────────────────────────────────────────────
export async function queueLead(leadData, orgId, userId) {
  const db = await openDB()
  const local_id = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const record = {
    local_id,
    lead: { ...leadData, org_id: orgId, scanned_by: userId },
    created_at: new Date().toISOString(),
    synced: false,
    attempts: 0
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readwrite')
    tx.objectStore(LEADS_STORE).add(record)
    tx.oncomplete = () => resolve(local_id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingLeads() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readonly')
    const request = tx.objectStore(LEADS_STORE).getAll()
    request.onsuccess = () => resolve(request.result.filter(r => !r.synced))
    request.onerror = () => reject(request.error)
  })
}

export async function getPendingCount() {
  const pending = await getPendingLeads()
  return pending.length
}

export async function markSynced(local_id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readwrite')
    tx.objectStore(LEADS_STORE).delete(local_id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

export async function incrementAttempts(local_id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEADS_STORE, 'readwrite')
    const store = tx.objectStore(LEADS_STORE)
    const request = store.get(local_id)
    request.onsuccess = () => {
      const record = request.result
      if (record) { record.attempts += 1; store.put(record) }
    }
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

// ── Exhibition cache ──────────────────────────────────────────

// Save exhibitions to local cache (call when online)
export async function cacheExhibitions(exhibitions) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXHIBITIONS_STORE, 'readwrite')
    const store = tx.objectStore(EXHIBITIONS_STORE)
    store.clear()
    for (const exh of exhibitions) {
      store.put(exh)
    }
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

// Get cached exhibitions (works offline)
export async function getCachedExhibitions() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXHIBITIONS_STORE, 'readonly')
    const request = tx.objectStore(EXHIBITIONS_STORE).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
