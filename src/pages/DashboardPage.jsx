import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getMatters } from '../store/mattersStore'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import './DashboardPage.css'

const fmtBWP = (n) =>
  n == null || isNaN(n)
    ? '—'
    : 'BWP ' + Number(n).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (val) => {
  if (!val) return '—'
  try {
    return new Date(val + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return val }
}

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    })
  }
  return months
}

function grandTotalOfMatter(matter) {
  const items = matter.lineItems || []
  const fees = items.reduce((s, it) => s + (parseFloat(it.legalFees) || 0), 0)
  const disb = items.reduce((s, it) => s + (parseFloat(it.disbursements) || 0), 0)
  return fees + disb
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const matters = getMatters()

  // ── Stat cards ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const nonArchived = matters.filter(m => m.status !== 'Archived')

    const totalBillable = matters.reduce((s, m) => s + grandTotalOfMatter(m), 0)

    const outstanding = nonArchived
      .filter(m => m.status !== 'Finalised')
      .reduce((s, m) => s + grandTotalOfMatter(m), 0)

    const activeCount = nonArchived.length

    let totalFees = 0, totalAllowed = 0
    matters.forEach(m => (m.lineItems || []).forEach(it => {
      totalFees += parseFloat(it.legalFees) || 0
      totalAllowed += parseFloat(it.allowed) || 0
    }))
    const recoveryRate = totalFees > 0
      ? ((totalAllowed / totalFees) * 100).toFixed(1) + '%'
      : '—'

    return { totalBillable, outstanding, activeCount, recoveryRate }
  }, [matters])

  // ── Billing trends (last 6 months) ──────────────────────────
  const chartData = useMemo(() => {
    const months = getLast6Months()
    return months.map(({ year, month, label }) => {
      const total = matters
        .filter(m => {
          if (!m.taxingDate) return false
          const d = new Date(m.taxingDate + 'T00:00:00')
          return d.getFullYear() === year && d.getMonth() === month
        })
        .reduce((s, m) => {
          const fees = (m.lineItems || []).reduce(
            (a, it) => a + (parseFloat(it.legalFees) || 0), 0
          )
          return s + fees
        }, 0)
      return { label, total }
    })
  }, [matters])

  const hasChartData = chartData.some(d => d.total > 0)

  // ── Upcoming taxing deadlines ────────────────────────────────
  const deadlines = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return matters
      .filter(m => m.status !== 'Archived' && m.taxingDate)
      .map(m => ({ ...m, _date: new Date(m.taxingDate + 'T00:00:00') }))
      .filter(m => m._date >= today)
      .sort((a, b) => a._date - b._date)
      .slice(0, 4)
  }, [matters])

  // ── Recent activity ──────────────────────────────────────────
  const recent = useMemo(() => {
    return [...matters]
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, 5)
  }, [matters])

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Overview of all matters and billing activity.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/matters/new')}>
          ＋ New Bill of Costs
        </button>
      </div>

      {/* Stat cards */}
      <div className="dash-stats">
        <StatCard
          label="Total Billable"
          value={fmtBWP(stats.totalBillable)}
          sub="All matters combined"
        />
        <StatCard
          label="Outstanding"
          value={fmtBWP(stats.outstanding)}
          sub="Not yet finalised"
        />
        <StatCard
          label="Active Matters"
          value={stats.activeCount}
          sub="Non-archived"
        />
        <StatCard
          label="Recovery Rate"
          value={stats.recoveryRate}
          sub="Allowed ÷ Fees claimed"
          accent
        />
      </div>

      {/* Chart + Deadlines */}
      <div className="dash-mid">
        {/* Billing trends */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Billing Trends</h2>
            <span className="dash-card-sub">Legal fees by taxing date — last 6 months</span>
          </div>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  formatter={v => ['BWP ' + v.toLocaleString('en-BW', { minimumFractionDigits: 2 }), 'Legal Fees']}
                  contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty-chart">
              <span>No data yet</span>
              <p>Add matters with a taxing date to see billing trends.</p>
            </div>
          )}
        </div>

        {/* Deadlines */}
        <div className="dash-card dash-card--narrow">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Taxing Deadlines</h2>
            <span className="dash-card-sub">Next upcoming</span>
          </div>
          {deadlines.length === 0 ? (
            <div className="dash-empty-deadlines">No upcoming deadlines</div>
          ) : (
            <div className="deadlines-list">
              {deadlines.map(m => (
                <div key={m.id} className="deadline-item" onClick={() => navigate(`/matters/${m.id}`)}>
                  <div className="deadline-date-block">
                    <span className="deadline-day">
                      {m._date.toLocaleDateString('en-GB', { day: '2-digit' })}
                    </span>
                    <span className="deadline-mon">
                      {m._date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>
                  <div className="deadline-info">
                    <div className="deadline-matter">
                      {m.plaintiff && m.defendant
                        ? `${m.plaintiff} v ${m.defendant}`
                        : m.caseNumber || 'Untitled Matter'}
                    </div>
                    <div className="deadline-court">{m.court || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/matters" className="dash-view-all">View All Matters →</Link>
        </div>
      </div>

      {/* Recent activity table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">Recent Matters Activity</h2>
          <span className="dash-card-sub">Last 5 updated</span>
        </div>

        {recent.length === 0 ? (
          <div className="dash-empty-matters">
            <p>No matters yet.</p>
            <button className="btn-primary" onClick={() => navigate('/matters/new')}>
              ＋ Create your first bill of costs
            </button>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Matter</th>
                <th>Status</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map(m => (
                <tr key={m.id}>
                  <td className="dt-ref">{m.caseNumber || '—'}</td>
                  <td className="dt-matter">
                    {m.plaintiff && m.defendant
                      ? `${m.plaintiff} v ${m.defendant}`
                      : 'Untitled Matter'}
                  </td>
                  <td><StatusBadge status={m.status} /></td>
                  <td className="dt-amount">{fmtBWP(grandTotalOfMatter(m))}</td>
                  <td>
                    <Link to={`/matters/${m.id}`} className="dt-open">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
