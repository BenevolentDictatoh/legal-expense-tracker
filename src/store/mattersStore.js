const KEY = 'matters'

export function getMatters() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function getMatter(id) {
  return getMatters().find(m => m.id === id) || null
}

export function saveMatter(matter) {
  const matters = getMatters()
  const idx = matters.findIndex(m => m.id === matter.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    matters[idx] = { ...matter, updatedAt: now }
  } else {
    matters.push({ ...matter, createdAt: now, updatedAt: now })
  }
  sessionStorage.setItem(KEY, JSON.stringify(matters))
  return matter
}

export function archiveMatter(id) {
  const matters = getMatters()
  const idx = matters.findIndex(m => m.id === id)
  if (idx >= 0) {
    matters[idx] = { ...matters[idx], status: 'Archived', updatedAt: new Date().toISOString() }
    sessionStorage.setItem(KEY, JSON.stringify(matters))
  }
}

export function generateId() {
  return `matter_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function emptyMatter() {
  return {
    id: null,
    caseNumber: '',
    court: 'High Court of Botswana',
    division: 'Gaborone Main Division',
    taxingDate: '',
    plaintiff: '',
    defendant: '',
    lawFirm: '',
    attorney: '',
    opposingCounsel: '',
    periodFrom: '',
    periodTo: '',
    experienceTier: '700',
    activeRate: 700,
    status: 'Draft',
    lineItems: [],
    createdAt: null,
    updatedAt: null,
  }
}
