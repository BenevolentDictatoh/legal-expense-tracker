import './StatusBadge.css'

const CONFIG = {
  'Draft':       { cls: 'sb-draft' },
  'In Progress': { cls: 'sb-inprogress' },
  'Finalised':   { cls: 'sb-finalised' },
  'Disputed':    { cls: 'sb-disputed' },
  'Archived':    { cls: 'sb-archived' },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { cls: 'sb-draft' }
  return <span className={`status-badge ${cfg.cls}`}>{status || 'Draft'}</span>
}
