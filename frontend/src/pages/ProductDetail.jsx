import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, adjustStock } from '../api/inventory'
import { useAuth } from '../context/AuthContext'
import { Spinner, Badge, Modal, Alert } from '../components/ui'
import { formatCurrency, formatDateTime, getErrorMessage } from '../utils/helpers'
import { ArrowLeft, TrendingUp, TrendingDown, Sliders } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isStaff } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stockModal, setStockModal] = useState(false)
  const [stockForm, setStockForm] = useState({ quantity_change: '', movement_type: 'ADJUSTMENT', reference: '', notes: '' })
  const [stockError, setStockError] = useState('')
  const [stockSaving, setStockSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getProduct(id)
      .then(r => setProduct(r.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleAdjustStock = async () => {
    setStockSaving(true); setStockError('')
    try {
      await adjustStock(id, { ...stockForm, quantity_change: Number(stockForm.quantity_change) })
      setStockModal(false)
      setStockForm({ quantity_change: '', movement_type: 'ADJUSTMENT', reference: '', notes: '' })
      load()
    } catch (err) {
      setStockError(getErrorMessage(err))
    } finally {
      setStockSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <Alert message={error} />
  if (!product) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{product.name}</h2>
          <span className="td-mono" style={{ fontSize: 13 }}>{product.sku}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Main Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Product Details</div>
            {isStaff && (
              <button className="btn btn-primary btn-sm" onClick={() => setStockModal(true)}>
                <Sliders size={14} /> Adjust Stock
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: 'Category', value: product.category?.name },
              { label: 'Status', value: <Badge value={product.is_active ? 'active' : 'inactive'} label={product.is_active ? 'Active' : 'Inactive'} /> },
              { label: 'Selling Price', value: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(product.price)}</span> },
              { label: 'Cost Price', value: formatCurrency(product.cost_price) },
              { label: 'Quantity in Stock', value: <span style={{ fontWeight: 700, color: product.is_low_stock ? 'var(--warning)' : 'var(--text-primary)' }}>{product.quantity_in_stock}</span> },
              { label: 'Reorder Level', value: product.reorder_level },
              { label: 'Stock Status', value: <Badge value={product.is_low_stock ? 'true' : 'false'} label={product.is_low_stock ? 'Low Stock' : 'Sufficient'} /> },
              { label: 'Profit Margin', value: <span style={{ color: 'var(--info)', fontWeight: 600 }}>{product.price > 0 ? (((product.price - product.cost_price) / product.price) * 100).toFixed(1) : 0}%</span> },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 15 }}>{value}</div>
              </div>
            ))}
          </div>
          {product.description && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Description</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{product.description}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Stock Value (Cost)', value: formatCurrency(product.cost_price * product.quantity_in_stock), color: 'var(--info)' },
            { label: 'Stock Value (Retail)', value: formatCurrency(product.price * product.quantity_in_stock), color: 'var(--success)' },
            { label: 'Last Updated', value: formatDateTime(product.updated_at), color: 'var(--text-muted)' },
          ].map(s => (
            <div className="card" key={s.label} style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Movements */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Stock Movements</div>
          <span className="tag">Last 5</span>
        </div>
        {!product.recent_movements?.length ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No stock movements recorded yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Type</th><th>Quantity</th><th>Reference</th><th>Performed By</th><th>Date</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {product.recent_movements.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.movement_type === 'INBOUND' ? <TrendingUp size={14} color="var(--success)" /> : m.movement_type === 'OUTBOUND' ? <TrendingDown size={14} color="var(--danger)" /> : <Sliders size={14} color="var(--info)" />}
                        <Badge value={m.movement_type} label={m.movement_type} />
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: m.quantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td><span className="td-mono">{m.reference || '—'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.performed_by_email || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDateTime(m.created_at)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal open={stockModal} onClose={() => setStockModal(false)} title="Adjust Stock"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setStockModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdjustStock} disabled={stockSaving}>{stockSaving ? 'Saving...' : 'Apply Adjustment'}</button>
        </>}
      >
        {stockError && <Alert message={stockError} />}
        <div className="form-group">
          <label className="form-label">Quantity Change *</label>
          <input className="form-control" type="number" value={stockForm.quantity_change} onChange={e => setStockForm(s => ({ ...s, quantity_change: e.target.value }))} placeholder="Positive to add, negative to remove" />
          <div className="form-hint">Current stock: <strong>{product.quantity_in_stock}</strong></div>
        </div>
        <div className="form-group">
          <label className="form-label">Movement Type</label>
          <select className="form-control" value={stockForm.movement_type} onChange={e => setStockForm(s => ({ ...s, movement_type: e.target.value }))}>
            <option value="ADJUSTMENT">Manual Adjustment</option>
            <option value="INBOUND">Inbound (Restock)</option>
            <option value="OUTBOUND">Outbound (Manual Removal)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Reference</label>
          <input className="form-control" value={stockForm.reference} onChange={e => setStockForm(s => ({ ...s, reference: e.target.value }))} placeholder="PO number, Audit tag..." />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={stockForm.notes} onChange={e => setStockForm(s => ({ ...s, notes: e.target.value }))} rows={2} placeholder="Reason for adjustment..." />
        </div>
      </Modal>
    </div>
  )
}
