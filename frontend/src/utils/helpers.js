export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0)

export const formatDate = (str) =>
  str ? new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (str) =>
  str ? new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export const getInitials = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return (email || 'U')[0].toUpperCase()
}

export const getErrorMessage = (err) => {
  if (!err.response) return 'Network error. Is the server running?'
  const data = err.response.data
  if (typeof data === 'string') return data
  if (data?.detail) return data.detail
  if (data?.error) return data.error
  if (data?.non_field_errors) return data.non_field_errors.join(', ')
  const first = Object.entries(data || {})[0]
  if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(', ') : first[1]}`
  return 'An unexpected error occurred'
}
