import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatter, saveMatter, generateId, emptyMatter } from '../store/mattersStore'
import { useTariff } from '../context/TariffContext'
import Breadcrumb from '../components/ui/Breadcrumb'
import './MatterDetailPage.css'

const STATUSES = ['Draft', 'In Progress', 'Finalised', 'Disputed']

export default function MatterDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const { hourlyRates } = useTariff()

  const [matter, setMatter] = useState(() => {
    if (isNew) return emptyMatter()
    return getMatter(id) || emptyMatter()
  })

  const set = (field, value) => setMatter(prev => ({ ...prev, [field]: value }))

  const doSave = () => {
    const toSave = matter.id
      ? matter
      : { ...matter, id: generateId() }

    // Keep activeRate in sync with experienceTier
    const active = parseFloat(toSave.experienceTier) || 0
    saveMatter({ ...toSave, activeRate: active })
    return toSave
  }

  const handleSave = () => {
    doSave()
    navigate('/matters')
  }

  const handleGoToItems = () => {
    const saved = doSave()
    navigate(`/matters/${saved.id}/items`)
  }

  const field = (label, key, props = {}) => {
    const { span, hint, ...rest } = props
    return (
      <div className={`md-field${span ? ` span-${span}` : ''}`}>
        <label className="md-label">
          {label}
          {hint && <span className="md-hint"> — {hint}</span>}
        </label>
        <input
          className="md-input"
          value={matter[key] ?? ''}
          onChange={e => set(key, e.target.value)}
          {...rest}
        />
      </div>
    )
  }

  const breadcrumbLabel = isNew
    ? 'New Matter'
    : matter.caseNumber || 'Matter Details'

  return (
    <div className="matter-detail-page">
      <div className="md-top">
        <Breadcrumb items={[
          { label: 'Matters', to: '/matters' },
          { label: breadcrumbLabel },
        ]} />
      </div>

      <div className="md-page-header">
        <div>
          <h1 className="md-title">{isNew ? 'New Matter' : matter.caseNumber || 'Matter Details'}</h1>
          <p className="md-sub">Case identifiers, parties, court, and billing settings.</p>
        </div>
        <span className="badge-confidential">CONFIDENTIAL</span>
      </div>

      <div className="md-card">
        <div className="md-grid">
          {/* Row 1 */}
          {field('Case Number', 'caseNumber', { placeholder: 'e.g. CVHGB-000452-23' })}
          {field('Court', 'court', { placeholder: 'High Court of Botswana' })}
          {field('Division', 'division', { placeholder: 'Gaborone Main Division' })}
          {field('Taxing Date', 'taxingDate', { type: 'date' })}

          {/* Row 2 */}
          {field('Plaintiff / Applicant', 'plaintiff', { placeholder: 'Full name' })}
          {field('Defendant / Respondent', 'defendant', { placeholder: 'Full name' })}
          {field('Law Firm', 'lawFirm', { placeholder: 'Firm name & ref' })}
          {field('Attorney', 'attorney', { placeholder: 'Adv. Name Surname' })}

          {/* Row 3 */}
          {field('Opposing Counsel', 'opposingCounsel', { placeholder: 'Firm or attorney name', span: 2 })}
          {field('Period From', 'periodFrom', { type: 'date' })}
          {field('Period To', 'periodTo', { type: 'date' })}

          {/* Row 4 — status + rate tier */}
          <div className="md-field">
            <label className="md-label">Status</label>
            <select
              className="md-input"
              value={matter.status}
              onChange={e => set('status', e.target.value)}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="md-field span-2">
            <label className="md-label">
              Attorney Experience
              <span className="md-hint"> — sets the Section I party-and-party hourly rate</span>
            </label>
            <select
              className="md-input"
              value={matter.experienceTier ?? ''}
              onChange={e => set('experienceTier', e.target.value)}
            >
              {hourlyRates.map(r => (
                <option key={r.tier} value={String(r.max_rate_bwp)}>
                  {r.tier} — BWP {r.max_rate_bwp.toLocaleString()}/hr (max recoverable)
                </option>
              ))}
            </select>
          </div>

          <div className="md-field">
            <label className="md-label">Active Rate</label>
            <div className="md-rate-pill">
              BWP {parseFloat(matter.experienceTier || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 })}<span>/hr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="md-footer">
        <button className="btn-secondary" onClick={() => navigate('/matters')}>
          Cancel
        </button>
        <div className="md-footer-right">
          <button className="btn-outline" onClick={handleSave}>
            Save Matter
          </button>
          <button className="btn-primary" onClick={handleGoToItems}>
            Go to Line Items →
          </button>
        </div>
      </div>
    </div>
  )
}
