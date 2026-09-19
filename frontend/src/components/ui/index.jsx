// Spinner
export function Spinner() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" />
    </div>
  )
}

// Badge
const BADGE_MAP = {
  ADMIN: 'badge-purple',
  MANAGER: 'badge-info',
  STAFF: 'badge-warning',
  CLIENT: 'badge-gray',
  PENDING: 'badge-warning',
  PROCESSING: 'badge-info',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  INBOUND: 'badge-success',
  OUTBOUND: 'badge-danger',
  ADJUSTMENT: 'badge-info',
  true: 'badge-danger',
  false: 'badge-success',
  active: 'badge-success',
  inactive: 'badge-danger',
}

export function Badge({ value, label }) {
  const cls = BADGE_MAP[value] || BADGE_MAP[String(value)] || 'badge-gray'
  return <span className={`badge ${cls}`}>{label || value}</span>
}

// Alert
export function Alert({ type = 'error', message }) {
  if (!message) return null
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
    </div>
  )
}

// Modal
export function Modal({ open, onClose, title, children, footer, size = '' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// Empty State
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} />}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// Pagination
export function Pagination({ page, count, pageSize = 15, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
      <span className="page-info">Page {page} of {totalPages}</span>
      <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
    </div>
  )
}

// Confirm Dialog
export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
    </Modal>
  )
}
