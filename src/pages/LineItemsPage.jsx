import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getMatter, saveMatter } from '../store/mattersStore'
import LineItemsEditor from '../components/LineItemsEditor'
import BillPreview from '../components/BillPreview'
import Breadcrumb from '../components/ui/Breadcrumb'
import './LineItemsPage.css'

let nextId = Date.now()
const newItem = () => ({
  id: nextId++,
  date: '',
  details: '',
  preference: '',
  fee_type: '',
  tariff_amount: null,
  rate: '',
  qty: '',
  legalFees: '',
  disbursements: '',
  allowed: '',
})

const fmtDate = (val) => {
  if (!val) return '—'
  try {
    return new Date(val + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return val }
}

// Map matter → bill shape expected by BillPreview
const billFromMatter = (matter) => ({
  matterName: [matter.plaintiff, matter.defendant].filter(Boolean).join(' v '),
  caseNumber: matter.caseNumber,
  court: matter.court,
  division: matter.division,
  plaintiff: matter.plaintiff,
  defendant: matter.defendant,
  attorney: matter.attorney,
  firmName: matter.lawFirm,
  opposingCounsel: matter.opposingCounsel,
  periodFrom: matter.periodFrom,
  periodTo: matter.periodTo,
  taxingDate: matter.taxingDate,
  hourlyRateTier: matter.experienceTier || '700',
})

export default function LineItemsPage() {
  const { id } = useParams()
  const printRef = useRef(null)

  const [matter, setMatter] = useState(() => getMatter(id))
  const matterRef = useRef(matter)
  const [items, setItems] = useState(() => {
    const m = getMatter(id)
    if (!m) return [newItem()]
    const stored = m.lineItems || []
    return stored.length > 0 ? stored : [newItem()]
  })
  const [view, setView] = useState('edit')

  // ── Dirty / save state ──────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saved'
  const isMounted = useRef(false)

  // Keep ref in sync so save always uses latest matter
  useEffect(() => { matterRef.current = matter }, [matter])

  // Arm the dirty tracker AFTER mount completes (StrictMode-safe)
  useEffect(() => {
    const timer = setTimeout(() => { isMounted.current = true }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Mark dirty on item changes — skips until mount is fully complete
  useEffect(() => {
    if (!isMounted.current) return
    setIsDirty(true)
    setSaveStatus(null)
  }, [items])

  // Expose a guarded navigate: prompts if dirty, otherwise navigates normally
  const rawNavigate = useNavigate()
  const isDirtyRef = useRef(false)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const guardedNavigate = (to) => {
    if (isDirtyRef.current) {
      const ok = window.confirm(
        'You have unsaved changes.\nLeave this page? Your changes will be lost.'
      )
      if (!ok) return
    }
    rawNavigate(to)
  }

  // Block browser tab close / page refresh when dirty
  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const hourlyRate = parseFloat(matter?.experienceTier) || 0

  // Recalculate time_based fees when rate changes (bail out if nothing changes)
  useEffect(() => {
    setItems(prev => {
      let changed = false
      const next = prev.map(it => {
        if (it.fee_type !== 'time_based' || !it.qty) return it
        const fee = (parseFloat(it.qty) || 0) * hourlyRate
        const newFees = fee > 0 ? fee.toFixed(2) : ''
        if (newFees === it.legalFees) return it
        changed = true
        return { ...it, legalFees: newFees }
      })
      return changed ? next : prev
    })
  }, [hourlyRate])

  // ── Early return AFTER all hooks ────────────────────────────
  if (!matter) {
    return (
      <div className="li-not-found">
        <p>Matter not found.</p>
        <Link to="/matters">← Back to Matters</Link>
      </div>
    )
  }

  // ── Item operations ─────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, newItem()])

  const updateItem = (itemId, field, value) =>
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, [field]: value } : it))

  const updateItemBatch = (itemId, patch) =>
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, ...patch } : it))

  const deleteItem = (itemId) =>
    setItems(prev => prev.filter(it => it.id !== itemId))

  const moveItem = (itemId, dir) => {
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === itemId)
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  // ── Totals ──────────────────────────────────────────────────
  const totals = items.reduce(
    (acc, it) => ({
      legalFees: acc.legalFees + (parseFloat(it.legalFees) || 0),
      disbursements: acc.disbursements + (parseFloat(it.disbursements) || 0),
      allowed: acc.allowed + (parseFloat(it.allowed) || 0),
    }),
    { legalFees: 0, disbursements: 0, allowed: 0 }
  )
  const grandTotal = totals.legalFees + totals.disbursements

  // ── Save ────────────────────────────────────────────────────
  const doSave = (extraFields = {}) => {
    const updated = { ...matterRef.current, ...extraFields, lineItems: items }
    saveMatter(updated)
    setIsDirty(false)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2000)
    return updated
  }

  const handleSave = () => doSave()

  // ── Finalise toggle ─────────────────────────────────────────
  const isFinalised = matter.status === 'Finalised'

  const handleToggleFinalise = () => {
    const newStatus = isFinalised ? 'In Progress' : 'Finalised'
    const updated = doSave({ status: newStatus })
    setMatter(prev => ({ ...prev, status: newStatus }))
  }

  const handlePrint = () => window.print()

  const bill = billFromMatter(matter)
  const matterLabel = matter.caseNumber
    || [matter.plaintiff, matter.defendant].filter(Boolean).join(' v ')
    || 'Matter'

  return (
    <div className="li-page">
      {/* ── Header bar ── */}
      <div className="li-header">
        <div className="li-header-left">
          <Breadcrumb items={[
            { label: 'Matters', to: '/matters' },
            { label: matterLabel, to: `/matters/${id}` },
            { label: 'Line Items' },
          ]} />
          <div className="li-summary-bar">
            <span className="li-summary-item">
              <span className="li-summary-label">Case</span>
              {matter.caseNumber || '—'}
            </span>
            <span className="li-summary-div" />
            <span className="li-summary-item">
              {matter.plaintiff && matter.defendant
                ? `${matter.plaintiff} v ${matter.defendant}`
                : '—'}
            </span>
            <span className="li-summary-div" />
            <span className="li-summary-item">
              <span className="li-summary-label">Rate</span>
              BWP {hourlyRate.toLocaleString()}/hr
            </span>
            <span className="li-summary-div" />
            <span className="li-summary-item">
              <span className="li-summary-label">Taxing</span>
              {fmtDate(matter.taxingDate)}
            </span>
            <a href="#" className="li-edit-link" onClick={e => { e.preventDefault(); guardedNavigate(`/matters/${id}`) }}>Edit Details</a>
          </div>
        </div>

        <div className="li-header-actions">
          {/* Save status indicator */}
          <div className="li-save-status-wrap">
            {isDirty && (
              <span className="li-unsaved">● Unsaved changes</span>
            )}
            {saveStatus === 'saved' && (
              <span className="li-saved">✓ Saved</span>
            )}
          </div>

          <div className="li-view-toggle">
            <button
              className={view === 'edit' ? 'active' : ''}
              onClick={() => setView('edit')}
            >Edit</button>
            <button
              className={view === 'preview' ? 'active' : ''}
              onClick={() => setView('preview')}
            >Preview</button>
          </div>

          <button
            className={`btn-save${isDirty ? '' : ' btn-save--clean'}`}
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save
          </button>

          <button className="btn-export" onClick={handlePrint}>Export PDF</button>

          <button
            className={`btn-finalise${isFinalised ? ' btn-finalise--reopen' : ''}`}
            onClick={handleToggleFinalise}
          >
            {isFinalised ? 'Reopen Matter' : 'Finalise Statement'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {view === 'edit' ? (
        <>
          <div className="li-toolbar">
            <h2 className="li-section-title">Line Items</h2>
            <button className="btn-add-entry" onClick={addItem}>＋ Add New Entry</button>
          </div>

          <div className="li-table-wrap">
            <LineItemsEditor
              items={items}
              hourlyRate={hourlyRate}
              onUpdate={updateItem}
              onUpdateBatch={updateItemBatch}
              onDelete={deleteItem}
              onMove={moveItem}
            />
          </div>
        </>
      ) : (
        <div className="li-preview-wrap">
          <div className="preview-sheet" id="print-area" ref={printRef}>
            <BillPreview bill={bill} items={items} totals={{ ...totals, grandTotal }} />
          </div>
        </div>
      )}

      {/* ── Pinned totals bar ── */}
      {view === 'edit' && (
        <div className="li-bottom-bar">
          <div className="li-totals">
            <div className="li-total-item">
              <span className="li-total-label">TOTAL LEGAL FEES</span>
              <strong className="li-total-value">
                BWP {totals.legalFees.toLocaleString('en-BW', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="li-total-divider" />
            <div className="li-total-item">
              <span className="li-total-label">TOTAL DISBURSEMENTS</span>
              <strong className="li-total-value">
                BWP {totals.disbursements.toLocaleString('en-BW', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="li-total-divider" />
            <div className="li-total-item grand">
              <span className="li-total-label">GRAND TOTAL</span>
              <strong className="li-total-value grand-value">
                BWP {grandTotal.toLocaleString('en-BW', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print area for when in edit mode */}
      {view !== 'preview' && (
        <div id="print-area" style={{ display: 'none' }}>
          <BillPreview bill={bill} items={items} totals={{ ...totals, grandTotal }} />
        </div>
      )}
    </div>
  )
}
