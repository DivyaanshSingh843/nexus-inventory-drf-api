import { useEffect, useState, useCallback } from 'react'
import { getOrders, createOrder, cancelOrder, updateOrderStatus } from '../api/orders'
import { getProducts } from '../api/inventory'
import { useAuth } from '../context/AuthContext'
import { Spinner, Badge, Modal, Alert, EmptyState, Pagination, ConfirmModal } from '../components/ui'
import { formatCurrency, formatDateTime, getErrorMessage } from '../utils/helpers'
import { Plus, Search, ShoppingCart, X, Minus, RefreshCw } from 'lucide-react'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

export default function Orders() {
  const { isStaff, isManager } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)

  // Create Order
  const [createModal, setCreateModal] = useState(false)
  const [products, setProducts] = useState([])
  const [cartItems, setCartItems] = useState([{ product_id: '', quantity: 1 }])
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  // Cancel
  const [cancelId, setCancelId] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Status Update
  const [statusModal, setStatusModal] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Detail
  const [detailOrder, setDetailOrder] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, search, status: statusFilter || undefined }
      const res = await getOrders(params)
      setOrders(res.data.results || res.data)
      setCount(res.data.count || 0)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  const openCreate = async () => {
    const res = await getProducts({ page_size: 100 })
    setProducts(res.data.results || res.data)
    setCartItems([{ product_id: '', quantity: 1 }])
    setShippingAddress(''); setNotes(''); setCreateError('')
    setCreateModal(true)
  }

  const addItem = () => setCartItems(c => [...c, { product_id: '', quantity: 1 }])
  const removeItem = (i) => setCartItems(c => c.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => setCartItems(c => c.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const handleCreate = async () => {
    setCreating(true); setCreateError('')
    try {
      const items = cartItems.filter(i => i.product_id).map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }))
      await createOrder({ shipping_address: shippingAddress, notes, items })
      setCreateModal(false); load()
    } catch (err) {
      setCreateError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try { await cancelOrder(cancelId); setCancelId(null); load() } catch (err) { alert(getErrorMessage(err)) } finally { setCancelling(false) }
  }

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true)
    try { await updateOrderStatus(statusModal.id, newStatus); setStatusModal(null); load() } catch (err) { alert(getErrorMessage(err)) } finally { setUpdatingStatus(false) }
  }

  const getProductPrice = (pid) => products.find(p => p.id === Number(pid))?.price || 0
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.product_id && i.quantity ? getProductPrice(i.product_id) * i.quantity : 0), 0)

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="form-control" placeholder="Search orders..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Place Order</button>
        </div>
      </div>

      {error && <Alert message={error} />}

      {loading ? <Spinner /> : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders found" description="Place your first order to get started." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Order #</th><th>Client</th><th>Status</th><th>Items</th><th>Total</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                    <td onClick={e => e.stopPropagation()}><span className="td-mono">{o.order_number}</span></td>
                    <td>
                      <div className="td-primary" style={{ fontSize: 13 }}>{o.client_name || o.client_email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.client_email}</div>
                    </td>
                    <td><Badge value={o.status} label={o.status} /></td>
                    <td>{o.items?.length ?? 0} items</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(o.total_amount)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDateTime(o.created_at)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setCancelId(o.id)}>
                            <X size={13} /> Cancel
                          </button>
                        )}
                        {isStaff && o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => { setStatusModal(o); setNewStatus(o.status) }}>
                            <RefreshCw size={13} /> Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} count={count} onPageChange={setPage} />

      {/* Place Order Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Place New Order" size="lg"
        footer={<>
          <div style={{ flex: 1, fontWeight: 700, color: 'var(--success)' }}>Estimated: {formatCurrency(cartTotal)}</div>
          <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? 'Placing...' : 'Place Order'}</button>
        </>}
      >
        {createError && <Alert message={createError} />}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="form-label mb-0">Order Items</label>
            <button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>
          </div>
          {cartItems.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: 8, marginBottom: 8 }}>
              <select className="form-control" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} — Stock: {p.quantity_in_stock} — {formatCurrency(p.price)}</option>)}
              </select>
              <input className="form-control" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" />
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(i)} disabled={cartItems.length === 1}><Minus size={14} /></button>
            </div>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">Shipping Address *</label>
          <textarea className="form-control" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} rows={2} placeholder="Full shipping address..." />
        </div>
        <div className="form-group mb-0">
          <label className="form-label">Notes</label>
          <input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions..." />
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={`Order ${detailOrder?.order_number}`} size="lg"
        footer={<button className="btn btn-secondary" onClick={() => setDetailOrder(null)}>Close</button>}
      >
        {detailOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Status', value: <Badge value={detailOrder.status} label={detailOrder.status} /> },
                { label: 'Total Amount', value: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(detailOrder.total_amount)}</span> },
                { label: 'Client', value: detailOrder.client_name || detailOrder.client_email },
                { label: 'Email', value: detailOrder.client_email },
                { label: 'Shipping Address', value: detailOrder.shipping_address },
                { label: 'Order Date', value: formatDateTime(detailOrder.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            {detailOrder.notes && <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 14, color: 'var(--text-secondary)' }}><strong>Notes:</strong> {detailOrder.notes}</div>}
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Order Items</div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detailOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td><span className="td-mono">{item.product_sku}</span></td>
                      <td className="td-primary">{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmModal open={!!cancelId} onClose={() => setCancelId(null)} onConfirm={handleCancel} loading={cancelling} title="Cancel Order" message="Are you sure you want to cancel this order? Stock will be restored." />

      {/* Status Update Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Update Order Status"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updatingStatus}>{updatingStatus ? 'Updating...' : 'Update'}</button>
        </>}
      >
        <div className="form-group mb-0">
          <label className="form-label">New Status</label>
          <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  )
}
