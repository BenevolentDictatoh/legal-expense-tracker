import { useState, useEffect, useMemo, useRef } from 'react'
import { useTariff } from '../context/TariffContext'
import './LineItemsEditor.css'

/* ─── Fee type labels shown as small badges ─── */
const FEE_TYPE_BADGE = {
  time_based: { label: '⏱ hrs', cls: 'ft-time' },
  fixed_per_folio: { label: '📄 folio', cls: 'ft-folio' },
  fixed: { label: '✓ fixed', cls: 'ft-fixed' },
  fixed_maximum: { label: '⌂ max', cls: 'ft-max' },
  percentage_tiered: { label: '% tiered', cls: 'ft-pct' },
}

/* ─── Searchable preference combobox ─── */
function PrefSearch({ value, onSelect }) {
  const { allItems, allSections } = useTariff()
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Keep display in sync when parent resets the row
  useEffect(() => { setQuery(value || '') }, [value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.sectionLabel.toLowerCase().includes(q)
    )
  }, [query, allItems])

  // Group filtered items by section for display
  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of filtered) {
      if (!map.has(item.sectionCode)) {
        map.set(item.sectionCode, { label: `${item.sectionCode} — ${item.sectionLabel}`, items: [] })
      }
      map.get(item.sectionCode).items.push(item)
    }
    return [...map.values()]
  }, [filtered])

  const handleSelect = (item) => {
    setQuery(item.code)
    setOpen(false)
    onSelect(item)
  }

  return (
    <div className="pref-wrap" ref={wrapRef}>
      <input
        className="ci pref-input"
        value={query}
        placeholder="Code or keyword…"
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        autoComplete="off"
        spellCheck={false}
      />
      {open && grouped.length > 0 && (
        <div className="pref-drop">
          {grouped.map(grp => (
            <div key={grp.label}>
              <div className="pref-group-label">{grp.label}</div>
              {grp.items.map(item => (
                <div
                  key={item.code}
                  className={`pref-opt${item.code === value ? ' selected' : ''}`}
                  onMouseDown={() => handleSelect(item)}
                >
                  <span className="pref-opt-code">{item.code}</span>
                  <span className="pref-opt-desc">
                    {item.description.length > 80
                      ? item.description.slice(0, 80) + '…'
                      : item.description}
                  </span>
                  {item._amount != null && (
                    <span className="pref-opt-amt">BWP {item._amount}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Per-row qty/rate rendering based on fee_type ─── */
function QtyCell({ item, hourlyRate, onUpdate }) {
  const { fee_type, tariff_amount, qty } = item

  if (fee_type === 'time_based') {
    return (
      <div className="qty-wrap">
        <input
          className="ci ci-num"
          type="number"
          min="0"
          step="0.25"
          value={qty}
          placeholder="0.00"
          onChange={e => {
            const hrs = e.target.value
            const fee = (parseFloat(hrs) || 0) * (parseFloat(hourlyRate) || 0)
            onUpdate('qty', hrs)
            onUpdate('legalFees', fee > 0 ? fee.toFixed(2) : '')
          }}
        />
        <span className="qty-unit">hrs</span>
      </div>
    )
  }

  if (fee_type === 'fixed_per_folio') {
    return (
      <div className="qty-wrap">
        <input
          className="ci ci-num"
          type="number"
          min="0"
          step="1"
          value={qty}
          placeholder="0"
          onChange={e => {
            const count = e.target.value
            const rate = parseFloat(tariff_amount) || 0
            const fee = (parseFloat(count) || 0) * rate
            onUpdate('qty', count)
            onUpdate('legalFees', fee > 0 ? fee.toFixed(2) : '')
          }}
        />
        <span className="qty-unit">fol</span>
      </div>
    )
  }

  // fixed / fixed_maximum / percentage_tiered / no type selected → plain qty input
  return (
    <input
      className="ci ci-num"
      type="text"
      value={qty}
      placeholder="—"
      onChange={e => onUpdate('qty', e.target.value)}
    />
  )
}

function RateCell({ item, hourlyRate }) {
  const { fee_type, tariff_amount } = item

  if (fee_type === 'time_based') {
    return (
      <span className="rate-tag">
        {hourlyRate > 0 ? `BWP ${hourlyRate.toLocaleString()}/hr` : '—'}
      </span>
    )
  }
  if (fee_type === 'fixed_per_folio' && tariff_amount != null) {
    return <span className="rate-tag">BWP {tariff_amount}/fol</span>
  }
  if (fee_type === 'fixed' || fee_type === 'fixed_maximum') {
    return <span className="rate-tag fixed">Fixed</span>
  }
  if (fee_type === 'percentage_tiered') {
    return <span className="rate-tag pct">% tiered</span>
  }
  return <span className="rate-tag empty">—</span>
}

/* ─── Main editor ─── */
export default function LineItemsEditor({ items, hourlyRate, onUpdate, onUpdateBatch, onDelete, onMove }) {
  const { getItemByCode } = useTariff()

  const handlePrefSelect = (id, tariffItem) => {
    const patch = {
      preference: tariffItem.code,
      details: tariffItem.description,
      fee_type: tariffItem.fee_type,
      tariff_amount: tariffItem._amount,
      qty: '',
      rate: '',
    }

    // Pre-populate fees for simple fixed types
    if (tariffItem.fee_type === 'fixed' && tariffItem._amount != null) {
      patch.legalFees = String(tariffItem._amount)
    } else if (tariffItem.fee_type === 'fixed_maximum' && tariffItem._amount != null) {
      patch.legalFees = String(tariffItem._amount)
    } else {
      patch.legalFees = ''
    }

    onUpdateBatch(id, patch)
  }

  const makeUpdater = (id) => (field, value) => onUpdate(id, field, value)

  return (
    <div className="table-wrap">
      <table className="items-table">
        <thead>
          <tr>
            <th className="c-sno">S/NO</th>
            <th className="c-date">DATE</th>
            <th className="c-pref">CODE</th>
            <th className="c-details">DETAILS OF ATTENDANCE</th>
            <th className="c-rate">RATE</th>
            <th className="c-qty">QTY</th>
            <th className="c-num">LEGAL FEES</th>
            <th className="c-num">DISB.</th>
            <th className="c-num">ALLOWED</th>
            <th className="c-act"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const upd = makeUpdater(item.id)
            const badge = FEE_TYPE_BADGE[item.fee_type]

            return (
              <tr key={item.id}>
                {/* S/No */}
                <td className="c-sno sno">{String(idx + 1).padStart(2, '0')}</td>

                {/* Date */}
                <td className="c-date">
                  <input
                    className="ci ci-date"
                    type="date"
                    value={item.date}
                    onChange={e => upd('date', e.target.value)}
                  />
                </td>

                {/* Preference — searchable tariff picker */}
                <td className="c-pref">
                  <PrefSearch
                    value={item.preference}
                    onSelect={tariffItem => handlePrefSelect(item.id, tariffItem)}
                  />
                  {badge && (
                    <span className={`ft-badge ${badge.cls}`}>{badge.label}</span>
                  )}
                </td>

                {/* Details — autofilled, editable */}
                <td className="c-details">
                  <textarea
                    className="ci ci-details"
                    value={item.details}
                    rows={2}
                    placeholder="Autofills on code selection, or type manually…"
                    onChange={e => upd('details', e.target.value)}
                  />
                </td>

                {/* Rate — derived display */}
                <td className="c-rate">
                  <RateCell item={item} hourlyRate={hourlyRate} />
                </td>

                {/* Qty / Hrs / Folios — context-aware */}
                <td className="c-qty">
                  <QtyCell item={item} hourlyRate={hourlyRate} onUpdate={upd} />
                </td>

                {/* Legal Fees */}
                <td className="c-num">
                  <input
                    className="ci ci-num"
                    type="text"
                    value={item.legalFees}
                    placeholder="0.00"
                    onChange={e => upd('legalFees', e.target.value)}
                  />
                </td>

                {/* Disbursements */}
                <td className="c-num">
                  <input
                    className="ci ci-num"
                    type="text"
                    value={item.disbursements}
                    placeholder="0.00"
                    onChange={e => upd('disbursements', e.target.value)}
                  />
                </td>

                {/* Allowed */}
                <td className="c-num">
                  <input
                    className="ci ci-num"
                    type="text"
                    value={item.allowed}
                    placeholder="—"
                    onChange={e => upd('allowed', e.target.value)}
                  />
                </td>

                {/* Row actions */}
                <td className="c-act">
                  <div className="row-btns">
                    <button className="rb" onClick={() => onMove(item.id, -1)} disabled={idx === 0} title="Up">↑</button>
                    <button className="rb" onClick={() => onMove(item.id, 1)} disabled={idx === items.length - 1} title="Down">↓</button>
                    <button className="rb rb-del" onClick={() => onDelete(item.id)} title="Delete">✕</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
