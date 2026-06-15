import Tesseract from 'tesseract.js'

// ── Indian states and major cities ────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
]

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Ahmedabad',
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Vadodara',
  'Firozabad', 'Ludhiana', 'Patna', 'Agra', 'Nashik', 'Meerut', 'Faridabad',
  'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad',
  'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Prayagraj', 'Ranchi',
  'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
  'Madurai', 'Raipur', 'Kota', 'Malad', 'Borivali', 'Andheri', 'Bandra',
  'Powai', 'Worli', 'Dadar', 'Kurla', 'Ghatkopar', 'Mulund', 'Vashi',
  'Noida', 'Gurgaon', 'Gurugram', 'Ghaziabad', 'Dwarka', 'Rohini'
]

// ── Image pre-processing ──────────────────────────────────────
export async function preprocessImage(imageFile) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        const contrast = 1.5
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
        const adjusted = Math.min(255, Math.max(0, factor * (avg - 128) + 128))
        data[i] = adjusted; data[i + 1] = adjusted; data[i + 2] = adjusted
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

// ── QR detection ──────────────────────────────────────────────
export async function detectQR(imageFile) {
  try {
    if (!('BarcodeDetector' in window)) return null
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const img = await createImageBitmap(imageFile)
    const barcodes = await detector.detect(img)
    if (barcodes.length === 0) return null
    return barcodes[0].rawValue
  } catch { return null }
}

// ── vCard parser ──────────────────────────────────────────────
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
    if (k === 'TEL' || k.startsWith('TEL')) { if (!fields.mobile) fields.mobile = value }
    if (k === 'ADR' || k.startsWith('ADR')) {
      const parts = value.split(';')
      if (parts[2]) fields.address = parts[2].trim()
      if (parts[3]) fields.city = parts[3].trim()
      if (parts[4]) fields.state = parts[4].trim()
      if (parts[6]) fields.country = parts[6].trim()
    }
    if (k === 'N' && !fields.contact_person) {
      const parts = value.split(';')
      const name = [parts[1], parts[0]].filter(Boolean).join(' ').trim()
      if (name) fields.contact_person = name
    }
  }
  return fields
}

// ── OCR ───────────────────────────────────────────────────────
export async function runOCR(imageFile, onProgress) {
  const processed = await preprocessImage(imageFile)
  const result = await Tesseract.recognize(processed, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })
  return result.data.text
}

// ── Main scan function ────────────────────────────────────────
export async function scanCard(frontFile, backFile, onProgress) {
  let qrData = null
  let combinedText = ''

  qrData = await detectQR(frontFile)
  if (!qrData && backFile) qrData = await detectQR(backFile)

  if (qrData && qrData.toUpperCase().startsWith('BEGIN:VCARD')) {
    const vcardFields = parseVCard(qrData)
    const ocrText = await runOCR(frontFile, p => onProgress(Math.round(p * 0.8)))
    if (backFile) {
      const backText = await runOCR(backFile, p => onProgress(80 + Math.round(p * 0.2)))
      combinedText = ocrText + '\n' + backText
    } else {
      combinedText = ocrText
    }
    const ocrFields = parseCardText(combinedText)
    return { ...ocrFields, ...vcardFields }
  }

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

  const frontText = await runOCR(frontFile, p => onProgress(Math.round(p * 0.6)))
  combinedText = frontText
  if (backFile) {
    const backText = await runOCR(backFile, p => onProgress(60 + Math.round(p * 0.4)))
    combinedText += '\n' + backText
  }
  onProgress(100)
  return parseCardText(combinedText)
}

// ── Parse OCR text into fields ────────────────────────────────
export function parseCardText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1)
  const fullText = rawText

  const fields = {
    company_name: '', contact_person: '', mobile: '', email: '',
    address: '', designation: '', city: '', state: '', country: '', website: ''
  }

  // Email
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i)
  if (emailMatch) fields.email = emailMatch[0].toLowerCase()

  // Phone
  const phonePatterns = [
    /(\+91[\s\-]?[6-9]\d{9})/,
    /([6-9]\d{9})/,
    /(\+?1?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/,
    /(\+[\d\s\-().]{10,18})/,
    /(1800[\s\-]?\d{3}[\s\-]?\d{4})/,
  ]
  for (const pattern of phonePatterns) {
    const match = fullText.match(pattern)
    if (match) {
      const cleaned = match[0].trim()
      if (cleaned.replace(/\D/g, '').length >= 7) { fields.mobile = cleaned; break }
    }
  }

  // Website
  const webMatch = fullText.match(/(?:https?:\/\/|www\.)[^\s,\n]+/i)
  if (webMatch) fields.website = webMatch[0].replace(/[,.]$/, '').trim()

  // PIN code — extract and use to find city/state
  const pinMatch = fullText.match(/\b([1-9][0-9]{5})\b/)
  const pinCode = pinMatch ? pinMatch[1] : null

  // State detection
  for (const state of INDIAN_STATES) {
    if (fullText.toLowerCase().includes(state.toLowerCase())) {
      fields.state = state
      break
    }
  }

  // City detection
  for (const city of INDIAN_CITIES) {
    if (fullText.toLowerCase().includes(city.toLowerCase())) {
      fields.city = city
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
  // Default to India if PIN code found and no country detected
  if (!fields.country && pinCode) fields.country = 'India'

  // Designation keywords
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
      clean.length < 3 || clean.length > 40 || skipForName.has(line) ||
      clean.match(/\d/) || clean.match(/@/) || clean.match(/www\./i) ||
      designationKeywords.some(k => clean.toLowerCase().includes(k.toLowerCase()))
    ) continue
    const words = clean.split(/\s+/)
    if (words.length >= 2 && words.length <= 4) {
      const looksLikeName = words.every(w => w.length > 0 && (w[0] === w[0].toUpperCase() || w.length <= 3))
      if (looksLikeName && !fields.contact_person) { fields.contact_person = clean; break }
    }
  }

  // Company name
  const skipForCompany = new Set([fields.email, fields.website, fields.designation, fields.contact_person])
  for (const line of lines) {
    const clean = cleanLine(line)
    if (
      clean.length < 2 || clean.length > 60 || skipForCompany.has(line) ||
      clean === fields.contact_person || clean.match(/@/) || clean.match(/www\./i) ||
      clean.replace(/\D/g, '').length > 4
    ) continue
    if (!fields.company_name) { fields.company_name = clean; break }
  }

  // Address — find lines that look like address, exclude already-parsed fields
  const usedValues = new Set([
    fields.contact_person, fields.company_name, fields.designation,
    fields.email, fields.website, fields.city, fields.state, fields.country
  ])

  const addressLines = lines.filter(l => {
    const clean = cleanLine(l)
    return (
      clean.length > 5 &&
      !usedValues.has(clean) &&
      clean !== fields.contact_person &&
      clean !== fields.company_name &&
      !clean.match(/@/) &&
      !clean.match(/www\./i) &&
      !clean.match(/^\+?\d[\d\s\-()]{5,}$/) && // not a phone
      !designationKeywords.some(k => clean.toLowerCase().includes(k.toLowerCase()))
    )
  })

  // Pick the best address line — prefer ones with street/plot/no/flat keywords
  const addressKeywords = ['plot', 'flat', 'no.', 'no ', 'road', 'street', 'nagar', 'colony', 'sector', 'lane', 'marg', 'building', 'floor', 'unit', 'shop', 'office', 'complex', 'industrial']
  const preferredAddress = addressLines.find(l =>
    addressKeywords.some(k => l.toLowerCase().includes(k))
  )
  if (preferredAddress) {
    fields.address = cleanLine(preferredAddress)
  } else if (addressLines.length > 0) {
    fields.address = cleanLine(addressLines[0])
  }

  return fields
}
