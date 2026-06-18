import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { getPendingCount, getPendingLeads } from '../lib/offlineQueue'
import { runSync, setSyncCallback } from '../lib/syncEngine'

export default function SyncStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  useEffect(() => {
    // Load initial pending count
    getPendingCount().then(setPending)

    // Watch network status
    function handleOnline() { setOnline(true) }
    function handleOffline() { setOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Watch sync updates
    setSyncCallback(count => {
      setPending(count)
      if (count === 0) {
        setSyncing(false)
        setJustSynced(true)
        setTimeout(() => setJustSynced(false), 3000)
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Refresh pending count every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getPendingCount().then(setPending)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleManualSync() {
    if (!online || syncing) return
    setSyncing(true)
    await runSync()
    const count = await getPendingCount()
    setPending(count)
    setSyncing(false)
  }

  // Nothing to show if online and no pending
  if (online && pending === 0 && !justSynced) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 12,
      fontWeight: 600,
      background: online
        ? justSynced
          ? 'rgba(22,163,74,0.12)'
          : pending > 0
            ? 'rgba(217,119,6,0.12)'
            : 'transparent'
        : 'rgba(220,38,38,0.12)',
      color: online
        ? justSynced
          ? 'var(--success)'
          : pending > 0
            ? 'var(--warning)'
            : 'var(--text-muted)'
        : 'var(--danger)',
      cursor: online && pending > 0 ? 'pointer' : 'default'
    }}
    onClick={handleManualSync}
    >
      {!online && <><WifiOff size={13} /> Offline</>}
      {online && justSynced && <><CheckCircle size={13} /> Synced</>}
      {online && pending > 0 && !syncing && (
        <><RefreshCw size={13} /> {pending} pending — tap to sync</>
      )}
      {online && syncing && (
        <><span className="loading-spin" style={{ width: 13, height: 13, borderWidth: 2 }} /> Syncing...</>
      )}
    </div>
  )
}
