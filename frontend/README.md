# EnterpriseHub — Frontend

![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-4-purple?style=for-the-badge&logo=vite)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-yellow?style=for-the-badge&logo=javascript)
![Axios](https://img.shields.io/badge/Axios-JWT_Auth-green?style=for-the-badge)
![Recharts](https://img.shields.io/badge/Recharts-Analytics-orange?style=for-the-badge)

> **Modern dark-mode B2B inventory management dashboard built with React + Vite, connected to the Django REST API backend. Features role-based access control, real-time analytics charts, and a full order management workflow.**

---

## 🚀 Quick Start

### Step 1 — Install Dependencies
```bash
cd frontend
npm install
```

### Step 2 — Configure API URL
The `.env` file is already configured to point to the Django backend:
```env
VITE_API_BASE_URL=http://localhost:8000
```
> ⚠️ Make sure the backend is running on `localhost:8000` before starting the frontend.

### Step 3 — Start Development Server
```bash
npm run dev
```

**Frontend is now running at:** `http://localhost:5173`

---

## 🔑 Login Credentials

Use any of these demo accounts on the login page (click-to-fill buttons are provided):

| Email | Password | Role | Pages Accessible |
|-------|----------|------|-----------------|
| `admin@enterprisehub.com` | `admin123` | `ADMIN` | All pages |
| `manager@enterprisehub.com` | `manager123` | `MANAGER` | Dashboard, Products, Categories, Orders, Stock, Users, Analytics |
| `staff@enterprisehub.com` | `staff123` | `STAFF` | Products, Categories, Orders, Stock Movements |
| `client@acmecorp.com` | `client123` | `CLIENT` | Products, Categories, Orders, Profile |

---

## 📂 Folder Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance + JWT auto-refresh interceptor
│   │   ├── auth.js           # Auth API calls (login, profile, users)
│   │   ├── inventory.js      # Products, categories, stock movements
│   │   ├── orders.js         # Orders CRUD + cancel + status update
│   │   └── analytics.js      # Dashboard summary API
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx    # Main layout wrapper (sidebar + header)
│   │   │   ├── Sidebar.jsx   # Collapsible nav with role-based items
│   │   │   └── Header.jsx    # Fixed top header with user info
│   │   └── ui/
│   │       └── index.jsx     # Spinner, Badge, Modal, Alert, Pagination, etc.
│   ├── context/
│   │   └── AuthContext.jsx   # JWT state, login/logout, role helpers
│   ├── pages/
│   │   ├── Login.jsx         # Login page with demo credential buttons
│   │   ├── Dashboard.jsx     # Analytics with Pie, Bar & Area charts
│   │   ├── Products.jsx      # Product list (table + grid toggle)
│   │   ├── ProductDetail.jsx # Product detail + stock adjustment
│   │   ├── Categories.jsx    # Category CRUD
│   │   ├── Orders.jsx        # Orders + place order + cancel + status
│   │   ├── StockMovements.jsx# Stock audit trail
│   │   ├── Users.jsx         # User list with role filter
│   │   └── Profile.jsx       # Edit own profile
│   ├── utils/
│   │   └── helpers.js        # Currency, date formatters, error extractor
│   ├── App.jsx               # Router + protected routes
│   ├── main.jsx              # Entry point
│   └── index.css             # Full design system (dark-mode tokens)
├── .env                      # VITE_API_BASE_URL=http://localhost:8000
├── vite.config.js            # Vite config + API proxy
└── package.json
```

---

## 🎨 Pages & Features

| Page | Route | Role Access | Features |
|------|-------|-------------|---------|
| Login | `/login` | Public | JWT login, demo credential buttons |
| Dashboard | `/` | Manager, Admin | KPI cards, Pie/Bar/Area charts |
| Products | `/products` | All | Table/Grid view, search, filter, CRUD |
| Product Detail | `/products/:id` | All | Full info, stock movements, adjust stock |
| Categories | `/categories` | All | List, create, edit, delete |
| Orders | `/orders` | All | List, place order, cancel, status update, detail |
| Stock Movements | `/stock-movements` | Staff+ | Audit trail with type filter |
| Users | `/users` | Manager, Admin | User list with role chips & search |
| Profile | `/profile` | All | View & edit name, company, phone, address |

---

## 🔒 Authentication Flow

1. User submits email + password on `/login`
2. Backend returns `access` + `refresh` JWT tokens
3. Tokens stored in `localStorage`
4. Every API request auto-attaches `Authorization: Bearer <access_token>`
5. On `401` response → auto-refresh using `refresh_token`
6. On refresh failure → clears storage + redirects to `/login`

---

## 🛠️ Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| Vite | 4 | Build tool & dev server |
| React Router DOM | 6 | Client-side routing |
| Axios | latest | HTTP client + interceptors |
| Recharts | latest | Dashboard charts |
| Lucide React | latest | Icons |
| Inter (Google Fonts) | — | Typography |

---

## 🔧 Available Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 API Proxy

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` automatically, so there are no CORS issues in development:

```js
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

> The Django backend already has `CORS_ALLOW_ALL_ORIGINS = True` for development.
