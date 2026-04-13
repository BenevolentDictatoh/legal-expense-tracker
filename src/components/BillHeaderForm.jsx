import { useTariff } from '../context/TariffContext'

export default function BillHeaderForm({ bill, onChange }) {
  const { hourlyRates } = useTariff()

  const field = (label, key, props = {}) => {
    const { span, ...rest } = props
    return (
      <div className={`form-group${span ? ` span-${span}` : ''}`}>
        <label className="form-label">{label}</label>
        <input
          className="form-input"
          value={bill[key] ?? ''}
          onChange={e => onChange(key, e.target.value)}
          {...rest}
        />
      </div>
    )
  }

  return (
    <div className="form-grid">
      {/* Row 1 */}
      {field('Case Number', 'caseNumber', { placeholder: 'e.g. CVHGB-000452-23' })}
      {field('Court', 'court', { placeholder: 'High Court of Botswana' })}
      {field('Division', 'division', { placeholder: 'Gaborone Main Division' })}
      {field('Taxing Date', 'taxingDate', { type: 'date' })}

      {/* Row 2 */}
      {field('Plaintiff', 'plaintiff', { placeholder: 'Full name' })}
      {field('Defendant', 'defendant', { placeholder: 'Full name' })}
      {field('Law Firm', 'firmName', { placeholder: 'Firm name & ref' })}
      {field('Attorney', 'attorney', { placeholder: 'Adv. Name Surname' })}

      {/* Row 3 */}
      {field('Opposing Counsel', 'opposingCounsel', { placeholder: 'Firm or attorney name', span: 2 })}
      {field('Period From', 'periodFrom', { type: 'date' })}
      {field('Period To', 'periodTo', { type: 'date' })}

      {/* Row 4 — tariff rate tier */}
      <div className="form-group span-2">
        <label className="form-label">
          Attorney Experience
          <span className="form-label-hint"> — sets the Section I party-and-party hourly rate</span>
        </label>
        <select
          className="form-input"
          value={bill.hourlyRateTier ?? ''}
          onChange={e => onChange('hourlyRateTier', e.target.value)}
        >
          {hourlyRates.map(r => (
            <option key={r.tier} value={String(r.max_rate_bwp)}>
              {r.tier} — BWP {r.max_rate_bwp.toLocaleString()}/hr (max recoverable)
            </option>
          ))}
        </select>
      </div>

      <div className="form-group rate-display">
        <label className="form-label">Active Rate</label>
        <div className="rate-pill">
          BWP {parseFloat(bill.hourlyRateTier || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 })}<span>/hr</span>
        </div>
      </div>
    </div>
  )
}
