import Tesseract from 'tesseract.js'

// ── Image pre-processing for better OCR accuracy ──────────────
export async function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      // Draw original
      ctx.drawImage(img, 0, 0)

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Convert to greyscale
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        // Increase contrast
        const contrast = 1.5
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
        const adjusted = Math.min(255, Math.max(0, factor * (avg - 128) + 128))
        data[i] = adjusted
        data[i + 1] = adjusted
        data[i + 2] = adjusted
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.95)
    }
    img.src = url
  })
}

// ── QR Code detection using native BarcodeDetector API ────────
export async function detectQR(imageFile) {
  try {
    if (!('BarcodeDetector' in window)) return null
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const img = await createImageBitmap(imageFile)
    const barcodes = await detector.detect(img)
    if (barcodes.length === 0) return null
    return barcodes[0].rawValue
  } catch {
    return null
  }
}

// ── Parse vCard format into fields ────────────────────────────
export function parseVCard(vcardText) {
  const fields = {}
  const lines = vcardText.split(/\r?\n/)

  for (const line of lines) {
    const [key, ...rest] = line.split(':')
    const value = rest.join(':').trim()
    if (!value) continue

    const k = key.toUpperCase().split(';')[0]

    if (k === 'FN') fields.contact_person = value
    if (k === 'ORG') fields.company_name = value.replace(/;/g, ' ').trim()
    if (k === 'TITLE') fields.designation = value
    if (k === 'URL') fields.website = value
    if (k === 'EMAIL' || k.startsWith('EMAIL')) fields.email = value
    if (k === 'NOTE') fields.notes = value

    if (k === 'TEL' || k.startsWith('TEL')) {
      if (!fields.mobile) fields.mobile = value
    }

    if (k === 'ADR' || k.startsWith('ADR')) {
      // vCard ADR: PO Box;Extended;Street;City;State;Postal;Country
      const parts = value.split(';')
      if (parts[2]) fields.address = parts[2].trim()
      if (parts[3]) fields.city = parts[3].trim()
      if (parts[4]) fields.state = parts[4].trim()
      if (parts[6]) fields.country = parts[6].trim()
    }

    if (k === 'N' && !fields.contact_person) {
      // N: LastName;FirstName;Middle;Prefix;Suffix
      const parts = value.split(';')
      const name = [parts[1], parts[0]].filter(Boolean).join(' ').trim()
      if (name) fields.contact_person = name
    }
  }

  return fields
}

// ── Run OCR with image preprocessing ─────────────────────────
export async function runOCR(imageFile, onProgress) {
  const processed = await preprocessImage(imageFile)
  const result = await Tesseract.recognize(processed, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
    tessedit_pageseg_mode: '6', // Assume uniform block of text
  })
  return result.data.text
}

// ── Main scan function — runs QR + OCR together ───────────────
export async function scanCard(frontFile, backFile, onProgress) {
  let qrData = null
  let combinedText = ''

  // Run QR detection on front first
  qrData = await detectQR(frontFile)
  if (!qrData && backFile) {
    qrData = await detectQR(backFile)
  }

  // If QR is a vCard, parse it directly
  if (qrData && qrData.toUpperCase().startsWith('BEGIN:VCARD')) {
    const vcardFields = parseVCard(qrData)
    // Still run OCR to fill any missing fields
    const ocrText = await runOCR(frontFile, p => onProgress(Math.round(p * 0.8)))
    if (backFile) {
      const backText = await runOCR(backFile, p => onProgress(80 + Math.round(p * 0.2)))
      combinedText = ocrText + '\n' + backText
    } else {
      combinedText = ocrText
    }
    const ocrFields = parseCardText(combinedText)
    // vCard data wins over OCR where both have values
    return { ...ocrFields, ...vcardFields }
  }

  // If QR is a URL, put it in website field and use OCR for rest
  if (qrData && (qrData.startsWith('http') || qrData.startsWith('www'))) {
    const ocrText = await runOCR(frontFile, p => onProgress(Math.round(p * 0.8)))
    if (backFile) {
      const backText = await runOCR(backFile, p => onProgress(80 + Math.round(p * 0.2)))
      combinedText = ocrText + '\n' + backText
    } else {
      combinedText = ocrText
    }
    const ocrFields = parseCardText(combinedText)
    return { ...ocrFields, website: qrData }
  }

  // No QR — pure OCR
  const frontText = await runOCR(frontFile, p => onProgress(Math.round(p * 0.6)))
  combinedText = frontText
  if (backFile) {
    const backText = await runOCR(backFile, p => onProgress(60 + Math.round(p * 0.4)))
    combinedText += '\n' + backText
  }
  onProgress(100)
  return parseCardText(combinedText)
}

// ── Parse raw OCR text into structured fields ─────────────────
export function parseCardText(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1)

  const fields = {
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
    designation: '',
    city: '',
    state: '',
    country: '',
    website: ''
  }

  const fullText = rawText

  // Email
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i)
  if (emailMatch) fields.email = emailMatch[0].toLowerCase()

  // Phone
  const phonePatterns = [
    /(\+91[\s\-]?[6-9]\d{9})/,
    /(\+?1?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/,
    /([6-9]\d{9})/,
    /(\d{4}[\s\-]\d{3}[\s\-]\d{3})/,
    /(\+[\d\s\-().]{10,18})/,
    /(1800[\s\-]?\d{3}[\s\-]?\d{4})/,
  ]
  for (const pattern of phonePatterns) {
    const match = fullText.match(pattern)
    if (match) {
      const cleaned = match[0].trim()
      if (cleaned.replace(/\D/g, '').length >= 7) {
        fields.mobile = cleaned
        break
      }
    }
  }

  // Website
  const webMatch = fullText.match(/(?:https?:\/\/|www\.)[^\s,\n]+/i)
  if (webMatch) fields.website = webMatch[0].replace(/[,.]$/, '').trim()

  // Designation
  const designationKeywords = [
    'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'Director', 'Manager', 'Engineer',
    'President', 'VP', 'Vice President', 'Head', 'Lead', 'Senior', 'Junior',
    'Executive', 'Officer', 'Founder', 'Co-Founder', 'Partner', 'Associate',
    'Consultant', 'Analyst', 'Developer', 'Designer', 'Architect', 'Sales',
    'Marketing', 'Operations', 'Finance', 'HR', 'Proprietor', 'Owner',
    'Technical', 'General', 'Managing', 'Regional', 'National', 'Assistant'
  ]
  for (const line of lines) {
    const hasDesig = designationKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))
    if (hasDesig && !fields.designation && line.length < 60) {
      fields.designation = line.replace(/^[^a-zA-Z]+/, '').trim()
      break
    }
  }

  // Country
  const countries = ['India', 'USA', 'United States', 'UK', 'United Kingdom', 'Germany', 'China', 'Japan', 'UAE', 'Singapore', 'Australia', 'Canada']
  for (const country of countries) {
    if (fullText.toLowerCase().includes(country.toLowerCase())) {
      fields.country = country
      break
    }
  }

  function cleanLine(line) {
    return line
      .replace(/^[\|\[\{\(\~\!\=\#\*\^\-\_\+\<\>\\\/@\s]+/, '')
      .replace(/[\|\[\{\(\~\!\=\#\*\^\-\_\+\<\>\\\/@\s]+$/, '')
      .trim()
  }

  // Person name
  const skipForName = new Set([fields.email, fields.website, fields.designation])
  for (const line of lines) {
    const clean = cleanLine(line)
    if (
      clean.length < 3 || clean.length > 40 ||
      skipForName.has(line) || clean.match(/\d/) ||
      clean.match(/@/) || clean.match(/www\./i) ||
      designationKeywords.some(k => clean.toLowerCase().includes(k.toLowerCase()))
    ) continue
    const words = clean.split(/\s+/)
    if (words.length >= 2 && words.length <= 4) {
      const looksLikeName = words.every(w => w.length > 0 && (w[0] === w[0].toUpperCase() || w.length <= 3))
      if (looksLikeName && !fields.contact_person) {
        fields.contact_person = clean
        break
      }
    }
  }

  // Company name
  const skipForCompany = new Set([fields.email, fields.website, fields.designation, fields.contact_person])
  for (const line of lines) {
    const clean = cleanLine(line)
    if (
      clean.length < 2 || clean.length > 60 ||
      skipForCompany.has(line) || clean === fields.contact_person ||
      clean.match(/@/) || clean.match(/www\./i) ||
      clean.replace(/\D/g, '').length > 4
    ) continue
    if (!fields.company_name) { fields.company_name = clean; break }
  }

  // Address
  const usedLines = new Set([fields.contact_person, fields.company_name, fields.designation, fields.email, fields.website])
  const addressCandidates = lines.filter(l => {
    const clean = cleanLine(l)
    return (
      clean.length > 4 && !usedLines.has(clean) && !usedLines.has(l) &&
      clean !== fields.contact_person && clean !== fields.company_name &&
      !clean.match(/@/) && !clean.match(/www\./i) &&
      !clean.match(/^\+?\d[\d\s\-()]{5,}$/)
    )
  })
  if (addressCandidates.length > 0) fields.address = cleanLine(addressCandidates[0])

  return fields
}
