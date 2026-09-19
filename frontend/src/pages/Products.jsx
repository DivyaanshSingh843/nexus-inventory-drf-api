import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api/inventory'
import { useAuth } from '../context/AuthContext'
import { Spinner, Badge, Modal, Alert, EmptyState, Pagination } from '../components/ui'
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers'
import { Plus, Search, Package, Edit, Trash2, Eye } from 'lucide-react'

const EMPTY_FORM = { sku: '', name: '', description: '', category_id: '', price: '', cost_price: '', quantity_in_stock: '', reorder_level: 10, is_active: true }

export default function Products() {
  const { isManager, isStaff } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState('table')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, search, category: categoryFilter || undefined }
      const [prodRes, catRes] = await Promise.all([getProducts(params), getCategories()])
      setProducts(prodRes.data.results || prodRes.data)
      setCount(prodRes.data.count || 0)
      setCategories(catRes.data.results || catRes.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setModal(true) }
  const openEdit = (p) => { setEditing(p); setForm({ sku: p.sku, name: p.name, description: p.description || '', category_id: p.category?.id || p.category, price: p.price, cost_price: p.cost_price, quantity_in_stock: p.quantity_in_stock, reorder_level: p.reorder_level, is_active: p.is_active }); setFormError(''); setModal(true) }

  const handleSave = async () => {
    setSaving(true); setFormError('')
    try {
      const payload = { ...form, price: Number(form.price), cost_price: Number(form.cost_price), quantity_in_stock: Number(form.quantity_in_stock), reorder_level: Number(form.reorder_level) }
      if (editing) await updateProduct(editing.id, payload)
      else await createProduct(payload)
      setModal(false); fetchData()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await deleteProduct(id); fetchData() } catch (err) { alert(getErrorMessage(err)) }
  }

  const f = form
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="form-control" placeholder="Search products, SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 180 }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')}>
            {viewMode === 'table' ? '⊞ Grid' : '☰ Table'}
          </button>
          {isManager && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Add Product</button>}
        </div>
      </div>

      {error && <Alert message={error} />}

      {loading ? <Spinner /> : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Try adjusting your search or add a new product." />
      ) : viewMode === 'table' ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><span className="td-mono">{p.sku}</span></td>
                    <td><span className="td-primary">{p.name}</span></td>
                    <td><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.category_name || p.category?.name}</span></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.quantity_in_stock}
                        {p.is_low_stock && <Badge value="true" label="Low" />}
                      </div>
                    </td>
                    <td><Badge value={p.is_active ? 'active' : 'inactive'} label={p.is_active ? 'Active' : 'Inactive'} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(p.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/products/${p.id}`)} title="View"><Eye size={14} /></button>
                        {isStaff && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit"><Edit size={14} /></button>}
                        {isManager && <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Delete"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => (
            <div className="product-card" key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
              <div className="product-card-sku">{p.sku}</div>
              <div className="product-card-name">{p.name}</div>
              <div className="product-card-cat">{p.category_name || p.category?.name}</div>
              <div className="product-card-footer">
                <span className="product-price">{formatCurrency(p.price)}</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="product-stock">Stock: {p.quantity_in_stock}</div>
                  {p.is_low_stock && <Badge value="true" label="Low Stock" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} count={count} onPageChange={setPage} />

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
        </>}
      >
        {formError && <Alert message={formError} />}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SKU *</label>
            <input className="form-control" value={f.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. PROD-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-control" value={f.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input className="form-control" value={f.name} onChange={e => set('name', e.target.value)} placeholder="Product name" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control" value={f.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Product description..." />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Selling Price (₹) *</label>
            <input className="form-control" type="number" step="0.01" value={f.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cost Price (₹) *</label>
            <input className="form-control" type="number" step="0.01" value={f.cost_price} onChange={e => set('cost_price', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity in Stock</label>
            <input className="form-control" type="number" value={f.quantity_in_stock} onChange={e => set('quantity_in_stock', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Level</label>
            <input className="form-control" type="number" value={f.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.is_active} onChange={e => set('is_active', e.target.checked)} />
            <span className="form-label" style={{ margin: 0 }}>Active (visible to clients)</span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
