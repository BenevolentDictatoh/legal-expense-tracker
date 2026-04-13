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
  const navigate = useNavigate()
  const printRef = useRef(null)

  const [matter, setMatter] = useState(() => getMatter(id))
  const matterRef = useRef(matter)
  const [items, setItems] = useState(() => {
    const m = getMatter(id)
    if (!m) return [newItem()]
    const stored = m.lineItems || []
    return stored.length > 0 ? stored : [newItem()]
  })
  const [view, setView] = useState('edit') // 'edit' | 'preview'

  // Keep ref in sync so auto-save always sees latest matter
  useEffect(() => { matterRef.current = matter }, [matter])

  if (!matter) {
    return (
      <div className="li-not-found">
        <p>Matter not found.</p>
        <Link to="/matters">← Back to Matters</Link>
      </div>
    )
  }

  const hourlyRate = parseFloat(matter.experienceTier) || 0

  // Auto-save items to store whenever they change (uses ref to get freshest matter)
  useEffect(() => {
    saveMatter({ ...matterRef.current, lineItems: items })
  }, [items])

  // Recalculate time_based fees when rate changes
  useEffect(() => {
    setItems(prev => prev.map(it => {
      if (it.fee_type !== 'time_based' || !it.qty) return it
      const fee = (parseFloat(it.qty) || 0) * hourlyRate
      return { ...it, legalFees: fee > 0 ? fee.toFixed(2) : '' }
    }))
  }, [hourlyRate])

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

  const totals = items.reduce(
    (acc, it) => ({
      legalFees: acc.legalFees + (parseFloat(it.legalFees) || 0),
      disbursements: acc.disbursements + (parseFloat(it.disbursements) || 0),
      allowed: acc.allowed + (parseFloat(it.allowed) || 0),
    }),
    { legalFees: 0, disbursements: 0, allowed: 0 }
  )
  const grandTotal = totals.legalFees + totals.disbursements

  const handleFinalise = () => {
    saveMatter({ ...matter, lineItems: items, status: 'Finalised' })
    setMatter(prev => ({ ...prev, status: 'Finalised' }))
    alert('Matter finalised.')
  }

  const handlePrint = () => window.print()

  const bill = billFromMatter(matter)
  const matterLabel = matter.caseNumber || [matter.plaintiff, matter.defendant].filter(Boolean).join(' v ') || 'Matter'

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
            <Link to={`/matters/${id}`} className="li-edit-link">Edit Details</Link>
          </div>
        </div>

        <div className="li-header-actions">
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
          <button className="btn-export" onClick={handlePrint}>Export PDF</button>
          <button className="btn-finalise" onClick={handleFinalise}>Finalise Statement</button>
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
