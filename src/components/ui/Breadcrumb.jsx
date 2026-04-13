import { Link } from 'react-router-dom'
import './Breadcrumb.css'

export default function Breadcrumb({ items }) {
  // items: [{ label, to? }]
  // last item is current page (no link)
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={idx} className="bc-item">
            {idx > 0 && <span className="bc-sep">›</span>}
            {isLast || !item.to
              ? <span className="bc-current">{item.label}</span>
              : <Link className="bc-link" to={item.to}>{item.label}</Link>
            }
          </span>
        )
      })}
    </nav>
  )
}
