import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMatters, archiveMatter } from '../store/mattersStore'
import StatusBadge from '../components/ui/StatusBadge'
import './MattersListPage.css'

const fmtBWP = (n) => {
  if (!n && n !== 0) return '—'
  return 'BWP ' + Number(n).toLocaleString('en-BW', { minimumFractionDigits: 2 })
}

const fmtDate = (val) => {
  if (!val) return '—'
  try {
    return new Date(val + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return val }
}

function grandTotal(matter) {
  const items = matter.lineItems || []
  return items.reduce((s, it) => s + (parseFloat(it.legalFees) || 0) + (parseFloat(it.disbursements) || 0), 0)
}

export default function MattersListPage() {
  const navigate = useNavigate()
  const [matters, setMatters] = useState(() =>
    getMatters().filter(m => m.status !== 'Archived')
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
  )

  const handleArchive = (id) => {
    if (!confirm('Archive this matter? It will be moved to the Archive.')) return
    archiveMatter(id)
    setMatters(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="matters-list-page">
      <div className="ml-header">
        <div>
          <h1 className="ml-title">Matters</h1>
          <p className="ml-sub">All active bills of costs.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/matters/new')}>
          ＋ New Bill of Costs
        </button>
      </div>

      {matters.length === 0 ? (
        <div className="ml-empty">
          <div className="ml-empty-icon">📄</div>
          <p>No matters yet.</p>
          <button className="btn-primary" onClick={() => navigate('/matters/new')}>
            ＋ Create your first bill of costs
          </button>
        </div>
      ) : (
        <div className="ml-table-wrap">
          <table className="ml-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Matter</th>
                <th>Court</th>
                <th>Taxing Date</th>
                <th>Status</th>
                <th>Grand Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matters.map(m => (
                <tr key={m.id}>
                  <td className="ml-ref">{m.caseNumber || '—'}</td>
                  <td className="ml-matter">
                    {m.plaintiff && m.defendant
                      ? `${m.plaintiff} v ${m.defendant}`
                      : <span className="ml-untitled">Untitled Matter</span>}
                  </td>
                  <td className="ml-court">{m.court || '—'}</td>
                  <td className="ml-date">{fmtDate(m.taxingDate)}</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td className="ml-total">{fmtBWP(grandTotal(m))}</td>
                  <td className="ml-actions">
                    <button
                      className="ml-btn ml-btn--edit"
                      onClick={() => navigate(`/matters/${m.id}`)}
                      title="Edit matter details"
                    >
                      Edit
                    </button>
                    <button
                      className="ml-btn ml-btn--items"
                      onClick={() => navigate(`/matters/${m.id}/items`)}
                      title="Open line items"
                    >
                      Line Items
                    </button>
                    <button
                      className="ml-btn ml-btn--archive"
                      onClick={() => handleArchive(m.id)}
                      title="Archive this matter"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
