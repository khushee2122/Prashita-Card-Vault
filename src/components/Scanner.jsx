import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, RefreshCw, CheckCircle } from 'lucide-react'
import { runOCR, parseCardText } from '../lib/ocr'

export default function Scanner({ onScanned, onClose }) {
  const [mode, setMode] = useState('choose') // choose | camera | upload
  const [side, setSide] = useState('front')  // front | back
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputFrontRef = useRef(null)
  const fileInputBackRef = useRef(null)

  // ── Camera ───────────────────────────────────────────────────
  async function startCamera() {
    setError(null)
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      setError('Camera not available. Please use the upload option instead.')
      setMode('upload')
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
      const file = new File([blob], `card-${side}-${Date.now()}.jpg`, { type: 'image/jpeg' })
      handleFile(file)
    }, 'image/jpeg', 0.92)
  }

  // ── File handling ────────────────────────────────────────────
  function handleFile(file) {
    const url = URL.createObjectURL(file)
    if (side === 'front') { setFrontFile(file); setFrontPreview(url) }
    else                  { setBackFile(file);  setBackPreview(url) }
  }

  function handleUploadChange(e, s) {
    const file = e.target.files?.[0]
    if (!file) return
    setSide(s)
    handleFile(file)
  }

  // ── OCR ──────────────────────────────────────────────────────
  async function processCards() {
    if (!frontFile && !backFile) { setError('Please capture or upload at least one side of the card.'); return }
    setScanning(true)
    setProgress(0)
    setError(null)
    try {
      let combinedText = ''
      if (frontFile) {
        const text = await runOCR(frontFile, p => setProgress(Math.round(p * 0.6)))
        combinedText += text + '\n'
      }
      if (backFile) {
        const text = await runOCR(backFile, p => setProgress(60 + Math.round(p * 0.4)))
        combinedText += text
      }
      setProgress(100)
      const parsed = parseCardText(combinedText)
      stopCamera()
      onScanned(parsed, { front: frontFile, back: backFile })
    } catch (err) {
      setError('OCR failed. You can still fill fields manually.')
      stopCamera()
      onScanned({}, { front: frontFile, back: backFile })
    } finally {
      setScanning(false)
    }
  }

  function reset() {
    stopCamera()
    setMode('choose')
    setSide('front')
    setFrontFile(null); setBackFile(null)
    setFrontPreview(null); setBackPreview(null)
    setProgress(0); setError(null)
  }

  // ── UI ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Choose mode */}
      {mode === 'choose' && (
        <div className="stack" style={{ padding: '0 0 8px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Scan the visiting card using your camera or upload a photo.
          </p>
          <div className="grid-2">
            <button className="btn btn-secondary btn-block" style={{ flexDirection: 'column', padding: 20, height: 'auto', gap: 8 }} onClick={startCamera}>
              <Camera size={28} color="var(--accent)" />
              <span>Use Camera</span>
            </button>
            <button className="btn btn-secondary btn-block" style={{ flexDirection: 'column', padding: 20, height: 'auto', gap: 8 }} onClick={() => setMode('upload')}>
              <Upload size={28} color="var(--accent)" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera mode */}
      {mode === 'camera' && (
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
              background: 'rgba(108,99,255,0.85)',
              color: '#fff', padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13, fontWeight: 600
            }}>
              {side === 'front' ? 'Front of card' : 'Back of card'}
            </div>
          </div>

          <div className="flex-row">
            <button className="btn btn-primary btn-block" onClick={capturePhoto}>
              <Camera size={18} /> Capture {side === 'front' ? 'Front' : 'Back'}
            </button>
          </div>

          {(frontPreview || backPreview) && (
            <div className="grid-2" style={{ gap: 10 }}>
              {frontPreview && (
                <div style={{ position: 'relative' }}>
                  <img src={frontPreview} alt="Front" style={{ borderRadius: 8, width: '100%', aspectRatio: '3/2', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>Front ✓</span>
                </div>
              )}
              {backPreview && (
                <div style={{ position: 'relative' }}>
                  <img src={backPreview} alt="Back" style={{ borderRadius: 8, width: '100%', aspectRatio: '3/2', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999 }}>Back ✓</span>
                </div>
              )}
            </div>
          )}

          {frontPreview && !backPreview && (
            <button className="btn btn-secondary btn-block" onClick={() => setSide('back')}>
              + Capture Back of Card (optional)
            </button>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div className="stack">
          {/* Front */}
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Front of Card</p>
            {frontPreview
              ? <div style={{ position: 'relative' }}>
                  <img src={frontPreview} alt="Front" style={{ borderRadius: 8, width: '100%', maxHeight: 180, objectFit: 'cover' }} />
                  <button className="btn btn-danger btn-sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => { setFrontFile(null); setFrontPreview(null) }}>
                    <X size={14} /> Remove
                  </button>
                </div>
              : <label className="upload-zone">
                  <Upload size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14 }}>Tap to upload front</p>
                  <input type="file" accept="image/*" onChange={e => handleUploadChange(e, 'front')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </label>
            }
          </div>
          {/* Back */}
          <div>
            <p className="form-label" style={{ marginBottom: 8 }}>Back of Card <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></p>
            {backPreview
              ? <div style={{ position: 'relative' }}>
                  <img src={backPreview} alt="Back" style={{ borderRadius: 8, width: '100%', maxHeight: 180, objectFit: 'cover' }} />
                  <button className="btn btn-danger btn-sm" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => { setBackFile(null); setBackPreview(null) }}>
                    <X size={14} /> Remove
                  </button>
                </div>
              : <label className="upload-zone">
                  <Upload size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14 }}>Tap to upload back</p>
                  <input type="file" accept="image/*" onChange={e => handleUploadChange(e, 'back')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                </label>
            }
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: 12, color: 'var(--danger)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* OCR progress */}
      {scanning && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Reading card... {progress}%</p>
          <div className="ocr-progress">
            <div className="ocr-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Actions */}
      {(frontFile || backFile) && !scanning && (
        <div className="flex-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            <RefreshCw size={14} /> Retake
          </button>
          <button className="btn btn-primary" onClick={processCards}>
            <CheckCircle size={16} /> Read Card
          </button>
        </div>
      )}

      {mode !== 'choose' && !frontFile && !backFile && (
        <div className="flex-row" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={reset}>← Back</button>
          <button className="btn btn-secondary btn-sm" onClick={() => onScanned({}, {})}>
            Skip scan, fill manually
          </button>
        </div>
      )}
    </div>
  )
}
