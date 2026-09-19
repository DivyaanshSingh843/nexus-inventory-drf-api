import { useEffect, useState } from 'react'
import { getDashboard } from '../api/analytics'
import { Spinner, Badge, Alert } from '../components/ui'
import { formatCurrency, getErrorMessage } from '../utils/helpers'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, CheckCircle } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || 'var(--text-primary)' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <Alert message={error} />

  const { overview, inventory_metrics, top_selling_products } = data

  const orderPieData = [
    { name: 'Completed', value: overview.completed_orders },
    { name: 'Pending', value: overview.pending_orders },
    { name: 'Cancelled', value: overview.cancelled_orders },
  ]

  const topProds = top_selling_products.map(p => ({
    name: p.product__name?.substring(0, 14) + '...' || 'Product',
    qty: p.total_quantity_sold,
    revenue: Number(p.total_revenue_generated),
  }))

  return (
    <div>
      {/* KPI Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Revenue', value: formatCurrency(overview.total_revenue), icon: DollarSign, color: '#10b981', bg: 'var(--success-bg)' },
          { label: 'Total Orders', value: overview.total_orders, icon: ShoppingCart, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Completed Orders', value: overview.completed_orders, icon: CheckCircle, color: '#10b981', bg: 'var(--success-bg)' },
          { label: 'Pending Orders', value: overview.pending_orders, icon: TrendingUp, color: '#f59e0b', bg: 'var(--warning-bg)' },
          { label: 'Total Products', value: inventory_metrics.total_products, icon: Package, color: '#3b82f6', bg: 'var(--info-bg)' },
          { label: 'Low Stock Items', value: inventory_metrics.low_stock_products, icon: AlertTriangle, color: '#f59e0b', bg: 'var(--warning-bg)' },
          { label: 'Stock Retail Value', value: formatCurrency(inventory_metrics.total_stock_retail_value), icon: DollarSign, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
          { label: 'Out of Stock', value: inventory_metrics.out_of_stock_products, icon: AlertTriangle, color: '#ef4444', bg: 'var(--danger-bg)' },
        ].map(kpi => (
          <div className="stat-card" key={kpi.label}>
            <div className="stat-icon" style={{ background: kpi.bg }}>
              <kpi.icon size={22} color={kpi.color} />
            </div>
            <div className="stat-value">{kpi.value}</div>
            <div className="stat-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Order Status Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Order Status Distribution</div>
              <div className="card-subtitle">Breakdown of all orders by status</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={orderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {orderPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Health */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Inventory Health</div>
              <div className="card-subtitle">Product stock status overview</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { name: 'Active', value: inventory_metrics.active_products },
              { name: 'Low Stock', value: inventory_metrics.low_stock_products },
              { name: 'Out of Stock', value: inventory_metrics.out_of_stock_products },
            ]} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Products" radius={[6, 6, 0, 0]}>
                {['#10b981', '#f59e0b', '#ef4444'].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="card chart-full">
        <div className="card-header">
          <div>
            <div className="card-title">Top 5 Selling Products</div>
            <div className="card-subtitle">By total quantity sold</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={topProds}>
            <defs>
              <linearGradient id="qtyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="qty" name="Qty Sold" stroke="#6366f1" fill="url(#qtyGrad)" strokeWidth={2} />
            <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">Top Products by Sales</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>SKU</th><th>Product</th><th>Units Sold</th><th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top_selling_products.map((p, i) => (
                <tr key={p.product__id}>
                  <td>{i + 1}</td>
                  <td><span className="td-mono">{p.product__sku}</span></td>
                  <td><span className="td-primary">{p.product__name}</span></td>
                  <td>{p.total_quantity_sold}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(p.total_revenue_generated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
