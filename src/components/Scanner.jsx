import { useState, useRef } from 'react'
import { Camera, Upload, RefreshCw, CheckCircle, QrCode } from 'lucide-react'
import { scanCard } from '../lib/ocr'

export default function Scanner({ onScanned, onClose }) {
  const [step, setStep] = useState('front') // front | back | review
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(null) // null | camera

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // ── Camera ────────────────────────────────────────────────────
  async function startCamera() {
    setError(null)
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      setError('Camera not available. Please use the upload option.')
      setMode(null)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], `card-${step}-${Date.now()}.jpg`, { type: 'image/jpeg' })
      stopCamera()
      handleFile(file)
    }, 'image/jpeg', 0.92)
  }

  function handleFile(file) {
    const url = URL.createObjectURL(file)
    if (step === 'front') {
      setFrontFile(file)
      setFrontPreview(url)
      setStep('back')
      setMode(null)
    } else {
      setBackFile(file)
      setBackPreview(url)
      setStep('review')
      setMode(null)
    }
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function resetFront() {
    stopCamera()
    setFrontFile(null); setFrontPreview(null)
    setBackFile(null);  setBackPreview(null)
    setStep('front'); setMode(null)
    setError(null)
  }

  function resetBack() {
    stopCamera()
    setBackFile(null); setBackPreview(null)
    setStep('back'); setMode(null)
  }

  // ── Process card ──────────────────────────────────────────────
  async function processCards() {
    setScanning(true)
    setProgress(0)
    setProgressLabel('Checking for QR code...')
    setError(null)
    try {
      const fields = await scanCard(
        frontFile,
        backFile,
        (p) => {
          setProgress(p)
          if (p < 30) setProgressLabel('Checking for QR code...')
          else if (p < 70) setProgressLabel('Reading card text...')
          else setProgressLabel('Parsing contact info...')
        }
      )
      onScanned(fields, { front: frontFile, back: backFile })
    } catch (err) {
      setError('Could not read the card. You can fill fields manually.')
      onScanned({}, { front: frontFile, back: backFile })
    } finally {
      setScanning(false)
    }
  }

  // ── Choose screen ─────────────────────────────────────────────
  function ChooseScreen({ side }) {
    return (
      <div className="stack">
        <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
          <span style={{
            display: 'inline-block',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            padding: '4px 14px', borderRadius: 'var(--radius-full)',
            fontSize: 13, fontWeight: 600, marginBottom: 8
          }}>
            Step {side === 'front' ? '1' : '2'} of 2 — {side === 'front' ? 'Front' : 'Back'} of card
          </span>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {side === 'front'
              ? 'Capture the front of the visiting card'
              : 'Now capture the back of the card'}
          </p>
          {side === 'front' && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <QrCode size={12} style={{ display: 'inline', marginRight: 4 }} />
              QR codes will be detected automatically
            </p>
          )}
        </div>

        {side === 'back' && frontPreview && (
          <div style={{ position: 'relative' }}>
            <img src={frontPreview} alt="Front" style={{ borderRadius: 8, width: '100%', maxHeight: 110, objectFit: 'cover', opacity: 0.75 }} />
            <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'var(--success)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
              ✓ Front captured
            </span>
          </div>
        )}

        <div className="grid-2">
          <button className="btn btn-secondary btn-block" style={{ flexDirection: 'column', padding: 20, height: 'auto', gap: 8 }} onClick={startCamera}>
            <Camera size={28} color="var(--accent)" />
            <span>Use Camera</span>
          </button>
          <label className="btn btn-secondary btn-block" style={{ flexDirection: 'column', padding: 20, height: 'auto', gap: 8, cursor: 'pointer', position: 'relative' }}>
            <Upload size={28} color="var(--accent)" />
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handleUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
          </label>
        </div>

        {side === 'back' && (
          <div className="flex-row" style={{ justifyContent: 'space-between' }}>
            <button className="btn btn-ghost btn-sm" onClick={resetFront}>← Retake Front</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep('review')}>Skip Back →</button>
          </div>
        )}
      </div>
    )
  }

  // ── Camera screen ─────────────────────────────────────────────
  function CameraScreen() {
    return (
      <div className="stack">
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', aspectRatio: '4/3', position: 'relative' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 20,
            border: '2px solid rgba(108,99,255,0.7)',
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(108,99,255,0.85)', color: '#fff',
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            fontSize: 13, fontWeight: 600
          }}>
            {step === 'front' ? 'Front of card' : 'Back of card'}
          </div>
        </div>
        <div className="flex-row">
          <button className="btn btn-secondary btn-sm" onClick={() => { stopCamera(); setMode(null) }}>← Back</button>
          <button className="btn btn-primary btn-block" onClick={capturePhoto}>
            <Camera size={18} /> Capture {step === 'front' ? 'Front' : 'Back'}
          </button>
        </div>
      </div>
    )
  }

  // ── Review screen ─────────────────────────────────────────────
  function ReviewScreen() {
    return (
      <div className="stack">
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Review your captures</p>
        <div className="grid-2" style={{ gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <img src={frontPreview} alt="Front" style={{ borderRadius: 8, width: '100%', aspectRatio: '3/2', objectFit: 'cover', border: '2px solid var(--success)' }} />
            <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'var(--success)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>✓ Front</span>
            <button onClick={resetFront} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          {backPreview
            ? <div style={{ position: 'relative' }}>
                <img src={backPreview} alt="Back" style={{ borderRadius: 8, width: '100%', aspectRatio: '3/2', objectFit: 'cover', border: '2px solid var(--success)' }} />
                <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'var(--success)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>✓ Back</span>
                <button onClick={resetBack} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            : <div
                style={{ borderRadius: 8, aspectRatio: '3/2', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                onClick={() => { setStep('back'); setMode(null) }}
              >
                <Camera size={20} />
                <span>Add back</span>
              </div>
          }
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--danger)', fontSize: 14 }}>
            {error}
          </div>
        )}

        {scanning && (
          <div>
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{progressLabel}</p>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{progress}%</p>
            </div>
            <div className="ocr-progress"><div className="ocr-progress-bar" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={resetFront} disabled={scanning}>
            <RefreshCw size={14} /> Start Over
          </button>
          <button className="btn btn-primary" onClick={processCards} disabled={scanning}>
            {scanning ? <span className="loading-spin" /> : <CheckCircle size={16} />}
            {scanning ? 'Reading...' : 'Read Card'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {step === 'front' && mode === null   && <ChooseScreen side="front" />}
      {step === 'front' && mode === 'camera' && <CameraScreen />}
      {step === 'back'  && mode === null   && <ChooseScreen side="back" />}
      {step === 'back'  && mode === 'camera' && <CameraScreen />}
      {step === 'review' && <ReviewScreen />}

      <div style={{ marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} onClick={() => onScanned({}, {})}>
          Skip scan, fill manually
        </button>
      </div>
    </div>
  )
}
