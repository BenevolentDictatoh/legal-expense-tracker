import './BillPreview.css'

const fmt = (val) => {
  const n = parseFloat(val)
  if (!val || isNaN(n)) return ''
  return n.toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtDate = (val) => {
  if (!val) return ''
  try {
    return new Date(val + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return val }
}

export default function BillPreview({ bill, items, totals }) {
  const grandTotal = totals.legalFees + totals.disbursements
  const grandAllowed = totals.legalFeesAllowed + totals.disbursementsAllowed

  return (
    <div className="preview">
      {/* ── Document header ── */}
      <div className="preview-court">
        <div className="preview-court-name">IN THE {bill.court || 'HIGH COURT OF BOTSWANA'}</div>
        {bill.division && (
          <div className="preview-court-division">HELD AT {bill.division.toUpperCase()}</div>
        )}
        <div className="preview-case-no">
          CASE NO: {bill.caseNumber || '_______________'}
        </div>
      </div>

      <div className="preview-parties">
        <div className="preview-party-row">
          <span className="preview-party-name">{bill.plaintiff || '[PLAINTIFF / APPLICANT]'}</span>
          <span className="preview-party-role">Plaintiff / Applicant</span>
        </div>
        <div className="preview-versus">versus</div>
        <div className="preview-party-row">
          <span className="preview-party-name">{bill.defendant || '[DEFENDANT / RESPONDENT]'}</span>
          <span className="preview-party-role">Defendant / Respondent</span>
        </div>
      </div>

      <div className="preview-title">BILL OF COSTS</div>

      {bill.matterName && (
        <div className="preview-matter">Re: {bill.matterName}</div>
      )}

      {/* ── Preamble ── */}
      <div className="preview-preamble">
        <p>
          Be pleased to tax the following Bill of Costs of the{' '}
          {bill.plaintiff ? <strong>{bill.plaintiff}</strong> : 'Plaintiff/Applicant'},{' '}
          taxed {bill.taxingDate ? `on ${fmtDate(bill.taxingDate)}` : 'on a date to be determined'}.
        </p>
        {(bill.periodFrom || bill.periodTo) && (
          <p>
            Period covered:{' '}
            {bill.periodFrom ? fmtDate(bill.periodFrom) : '—'}
            {' '}to{' '}
            {bill.periodTo ? fmtDate(bill.periodTo) : '—'}.
          </p>
        )}
        {bill.attorney && (
          <p>Attorney: <strong>{bill.attorney}</strong>{bill.firmName ? `, ${bill.firmName}` : ''}</p>
        )}
      </div>

      {/* ── Bill table ── */}
      <table className="preview-table">
        <thead>
          <tr>
            <th className="p-sno">S/No.</th>
            <th className="p-date">Date</th>
            <th className="p-details">Details of Attendance</th>
            <th className="p-rate">Rate</th>
            <th className="p-qty">Qty</th>
            <th className="p-pref">Preference</th>
            <th className="p-money">Legal Fees (BWP)</th>
            <th className="p-money">Allowed</th>
            <th className="p-money">Disbursements (BWP)</th>
            <th className="p-money">Allowed</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} className={idx % 2 === 1 ? 'row-alt' : ''}>
              <td className="p-sno">{idx + 1}.</td>
              <td className="p-date">{fmtDate(item.date)}</td>
              <td className="p-details">{item.details || <span className="empty-cell">—</span>}</td>
              <td className="p-money">{fmt(item.rate)}</td>
              <td className="p-qty">{item.qty || ''}</td>
              <td className="p-pref">{item.preference}</td>
              <td className="p-money">{fmt(item.legalFees)}</td>
              <td className="p-money">{fmt(item.legalFeesAllowed)}</td>
              <td className="p-money">{fmt(item.disbursements)}</td>
              <td className="p-money">{fmt(item.disbursementsAllowed)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td colSpan={6} className="totals-label-cell">TOTALS</td>
            <td className="p-money total-cell">{fmt(totals.legalFees)}</td>
            <td className="p-money total-cell">{fmt(totals.legalFeesAllowed) || '—'}</td>
            <td className="p-money total-cell">{fmt(totals.disbursements)}</td>
            <td className="p-money total-cell">{fmt(totals.disbursementsAllowed) || '—'}</td>
          </tr>
          <tr className="grand-total-row">
            <td colSpan={6} className="totals-label-cell">GRAND TOTAL (Legal Fees + Disbursements)</td>
            <td colSpan={2} className="p-money total-cell grand">BWP {fmt(grandTotal)}</td>
            <td colSpan={2} className="p-money total-cell grand">
              {grandAllowed > 0 ? `BWP ${fmt(grandAllowed)}` : '—'}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── Certificate ── */}
      <div className="preview-certificate">
        <p>
          I, <strong>{bill.attorney || '____________________'}</strong>, attorney for the{' '}
          {bill.plaintiff ? `${bill.plaintiff} (Plaintiff/Applicant)` : 'Plaintiff/Applicant'}, hereby
          certify that the above bill of costs is correct and that the disbursements have been duly incurred.
        </p>

        <div className="preview-sig-block">
          <div className="sig-line">
            <div className="sig-underline" />
            <div className="sig-caption">
              {bill.attorney || 'Attorney for Plaintiff/Applicant'}
              {bill.firmName ? <><br />{bill.firmName}</> : null}
            </div>
          </div>
          <div className="sig-line">
            <div className="sig-underline" />
            <div className="sig-caption">Date</div>
          </div>
        </div>

        {bill.taxingDate && (
          <div className="preview-taxed">
            <strong>Taxed on:</strong> {fmtDate(bill.taxingDate)}
            <span className="taxed-amount">
              &nbsp;&nbsp;&nbsp; Amount Taxed: BWP _______________
            </span>
          </div>
        )}

        {bill.opposingCounsel && (
          <div className="preview-opposing">
            <strong>Opposing Counsel:</strong> {bill.opposingCounsel}
          </div>
        )}
      </div>
    </div>
  )
}
