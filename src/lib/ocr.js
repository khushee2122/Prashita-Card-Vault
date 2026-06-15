import Tesseract from 'tesseract.js'

// ── Run OCR on an image file ──────────────────────────────────
export async function runOCR(imageFile, onProgress) {
  const result = await Tesseract.recognize(imageFile, 'eng+hin', {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })
  return result.data.text
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

  // Email — very reliable regex
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i)
  if (emailMatch) fields.email = emailMatch[0]

  // Phone — India and international formats
  const phoneMatch = rawText.match(
    /(\+?[\d\s\-().]{7,})/
  )
  if (phoneMatch) {
    const cleaned = phoneMatch[0].replace(/[^\d+\-\s()]/g, '').trim()
    if (cleaned.replace(/\D/g, '').length >= 7) fields.mobile = cleaned
  }

  // Website
  const webMatch = rawText.match(/(?:www\.|https?:\/\/)[^\s,]+/i)
  if (webMatch) fields.website = webMatch[0].replace(/[,.]$/, '')

  // Designation keywords
  const designationKeywords = [
    'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'Director', 'Manager', 'Engineer',
    'President', 'VP', 'Vice President', 'Head', 'Lead', 'Senior', 'Junior',
    'Executive', 'Officer', 'Founder', 'Co-Founder', 'Partner', 'Associate',
    'Consultant', 'Analyst', 'Developer', 'Designer', 'Architect', 'Sales',
    'Marketing', 'Operations', 'Finance', 'HR', 'Proprietor', 'Owner'
  ]
  for (const line of lines) {
    const hasDesig = designationKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))
    if (hasDesig && !fields.designation) {
      fields.designation = line
      break
    }
  }

  // Country detection
  const countries = ['India', 'USA', 'United States', 'UK', 'United Kingdom', 'Germany', 'China', 'Japan', 'UAE', 'Singapore', 'Australia', 'Canada']
  for (const country of countries) {
    if (rawText.toLowerCase().includes(country.toLowerCase())) {
      fields.country = country
      break
    }
  }

  // Try to extract person name (usually first non-empty line without digits)
  for (const line of lines) {
    if (
      !line.match(/\d/) &&
      !line.match(/@/) &&
      !line.match(/www\./i) &&
      line.split(' ').length >= 2 &&
      line.split(' ').length <= 5 &&
      line.length < 40 &&
      !designationKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))
    ) {
      if (!fields.contact_person) {
        fields.contact_person = line
        break
      }
    }
  }

  // Company name — usually a short ALL-CAPS or Title Case line without @/www
  for (const line of lines) {
    if (
      line !== fields.contact_person &&
      !line.match(/@/) &&
      !line.match(/www\./i) &&
      !line.match(/\+?\d[\d\s\-()]{6,}/) &&
      line.length > 2 &&
      line.length < 60
    ) {
      if (!fields.company_name) {
        fields.company_name = line
        break
      }
    }
  }

  // Address — remaining longer lines
  const addressLines = lines.filter(l =>
    l !== fields.contact_person &&
    l !== fields.company_name &&
    l !== fields.designation &&
    !l.match(/@/) &&
    !l.match(/www\./i) &&
    l !== fields.email &&
    !l.includes(fields.mobile?.replace(/\s/g, '').slice(0, 6) || '___')
  )
  if (addressLines.length > 0) {
    fields.address = addressLines.slice(0, 2).join(', ')
  }

  return fields
}
