import { useEffect, useState, useCallback } from 'react'
import { getStockMovements } from '../api/inventory'
import { Spinner, Badge, Alert, EmptyState, Pagination } from '../components/ui'
import { formatDateTime, getErrorMessage } from '../utils/helpers'
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Sliders } from 'lucide-react'

export default function StockMovements() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getStockMovements({ page, search, movement_type: typeFilter || undefined })
      setMovements(res.data.results || res.data)
      setCount(res.data.count || 0)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter])

  useEffect(() => { load() }, [load])

  const TypeIcon = ({ type }) => {
    if (type === 'INBOUND') return <TrendingUp size={14} color="var(--success)" />
    if (type === 'OUTBOUND') return <TrendingDown size={14} color="var(--danger)" />
    return <Sliders size={14} color="var(--info)" />
  }

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="form-control" placeholder="Search by product, reference..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 180 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
            <option value="">All Types</option>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      {error && <Alert message={error} />}

      {/* Summary Badges */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Inbound (Restock)', icon: <TrendingUp size={14} />, cls: 'badge-success' },
          { label: 'Outbound (Orders)', icon: <TrendingDown size={14} />, cls: 'badge-danger' },
          { label: 'Manual Adjustment', icon: <Sliders size={14} />, cls: 'badge-info' },
        ].map(b => (
          <span key={b.label} className={`badge ${b.cls}`} style={{ padding: '6px 12px', fontSize: 12 }}>
            {b.icon} {b.label}
          </span>
        ))}
      </div>

      {loading ? <Spinner /> : movements.length === 0 ? (
        <EmptyState icon={ArrowUpDown} title="No stock movements found" description="Stock movements are recorded automatically on orders and manual adjustments." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Type</th><th>Product</th><th>SKU</th><th>Quantity</th><th>Reference</th><th>Performed By</th><th>Notes</th><th>Date</th></tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TypeIcon type={m.movement_type} />
                        <Badge value={m.movement_type} label={m.movement_type} />
                      </div>
                    </td>
                    <td className="td-primary">{m.product}</td>
                    <td><span className="td-mono">{m.product_sku}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, color: m.quantity > 0 ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td><span className="td-mono" style={{ fontSize: 12 }}>{m.reference || '—'}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.performed_by_email || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>
                      {m.notes ? m.notes.substring(0, 50) + (m.notes.length > 50 ? '...' : '') : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} count={count} onPageChange={setPage} />
    </div>
  )
}
