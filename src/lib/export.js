import * as XLSX from 'xlsx'

const FIELD_LABELS = {
  company_name: 'Company Name',
  contact_person: 'Contact Person',
  mobile: 'Mobile',
  email: 'Email',
  designation: 'Designation',
  address: 'Address',
  city: 'City',
  state: 'State',
  country: 'Country',
  website: 'Website',
  company_context: 'Company Context',
  lead_type: 'Type',
  notes: 'Notes',
  exhibition_name: 'Exhibition',
  scanned_by_name: 'Added By',
  created_at: 'Date Added'
}

function formatLeads(leads) {
  return leads.map(lead => {
    const row = {}
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      if (key === 'created_at') {
        row[label] = lead.created_at
          ? new Date(lead.created_at).toLocaleDateString('en-IN')
          : ''
      } else {
        row[label] = lead[key] || ''
      }
    }
    return row
  })
}

export function exportToExcel(leads, filename = 'CardVault_Leads') {
  const data = formatLeads(leads)
  const ws = XLSX.utils.json_to_sheet(data)

  // Column widths
  ws['!cols'] = [
    { wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 28 },
    { wch: 22 }, { wch: 32 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 24 }, { wch: 32 }, { wch: 10 },
    { wch: 32 }, { wch: 22 }, { wch: 18 }, { wch: 14 }
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportToCSV(leads, filename = 'CardVault_Leads') {
  const data = formatLeads(leads)
  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
