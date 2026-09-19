import { useEffect, useState, useCallback } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/inventory'
import { useAuth } from '../context/AuthContext'
import { Spinner, Modal, Alert, EmptyState, Pagination } from '../components/ui'
import { formatDate, getErrorMessage } from '../utils/helpers'
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-react'

export default function Categories() {
  const { isManager } = useAuth()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCategories({ page, search })
      setCats(res.data.results || res.data)
      setCount(res.data.count || 0)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setFormError(''); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setFormError(''); setModal(true) }

  const handleSave = async () => {
    setSaving(true); setFormError('')
    try {
      if (editing) await updateCategory(editing.id, form)
      else await createCategory(form)
      setModal(false); load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Products in it may be affected.')) return
    try { await deleteCategory(id); load() } catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="form-control" placeholder="Search categories..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        {isManager && (
          <div className="page-toolbar-right">
            <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Add Category</button>
          </div>
        )}
      </div>

      {error && <Alert message={error} />}

      {loading ? <Spinner /> : cats.length === 0 ? (
        <EmptyState icon={Tag} title="No categories found" description="Create your first category to organize products." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Slug</th><th>Products</th><th>Description</th><th>Created</th>{isManager && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {cats.map(c => (
                  <tr key={c.id}>
                    <td><span className="td-primary">{c.name}</span></td>
                    <td><span className="td-mono">{c.slug}</span></td>
                    <td>
                      <span style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)', padding: '2px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                        {c.products_count ?? '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 280 }}>
                      {c.description ? c.description.substring(0, 80) + (c.description.length > 80 ? '...' : '') : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(c.created_at)}</td>
                    {isManager && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit"><Edit size={14} /></button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} count={count} onPageChange={setPage} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
        </>}
      >
        {formError && <Alert message={formError} />}
        <div className="form-group">
          <label className="form-label">Category Name *</label>
          <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics" autoFocus />
          <div className="form-hint">A URL-friendly slug will be auto-generated.</div>
        </div>
        <div className="form-group mb-0">
          <label className="form-label">Description</label>
          <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="What types of products does this category include?" />
        </div>
      </Modal>
    </div>
  )
}
