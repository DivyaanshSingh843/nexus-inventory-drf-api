# EnterpriseHub — Full-Stack B2B Inventory & Order Management Platform

<div align="center">

![Django](https://img.shields.io/badge/Django_REST_Framework-5.1-red?style=for-the-badge&logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Multi--Tenant-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-SimpleJWT-FB015B?style=for-the-badge&logo=jsonwebtokens)
![OpenAPI](https://img.shields.io/badge/OpenAPI_3.0-Swagger_UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Pytest](https://img.shields.io/badge/Pytest-100%25_Pass-brightgreen?style=for-the-badge&logo=pytest)
![Celery](https://img.shields.io/badge/Celery-Async_Tasks-37814A?style=for-the-badge&logo=celery)

**A production-grade, full-stack B2B inventory and order management system.**
Backend powered by Django REST Framework with custom RBAC, atomic transactions, and ORM query optimizations.
Frontend built with React + Vite featuring a dark-mode glassmorphism dashboard, real-time analytics charts, and role-gated navigation.

[Backend API Docs](#-api-documentation) · [Frontend Features](#-frontend-features) · [Quick Start](#-quick-start) · [Architecture](#️-architecture)

</div>

---

## 📸 Project Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite 4 + JavaScript | Dark-mode SPA dashboard |
| **Backend** | Django 5.1 + DRF 3.17 | RESTful API engine |
| **Auth** | SimpleJWT + Custom RBAC | 4-tier role-based access |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Relational data store |
| **Task Queue** | Celery + Redis/Memory | Async email & invoice |
| **Caching** | Memcached | Query result caching |
| **API Docs** | drf-spectacular (OpenAPI 3.0) | Swagger UI + ReDoc |

---

## 📁 Project Structure

```
django-enterprise-backend-api/
│
├── backend/                        ← Django REST API
│   ├── apps/
│   │   ├── authentication/         Custom User Model, JWT, RBAC permissions
│   │   ├── inventory/              Products, Categories, Stock Movements
│   │   ├── orders/                 Atomic Checkout Engine, Celery Tasks
│   │   └── analytics/              Real-Time ORM Aggregations
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py             Core Django & DRF settings
│   │   │   ├── local.py            SQLite dev + eager Celery
│   │   │   └── production.py       PostgreSQL + security hardening
│   │   ├── celery.py
│   │   └── urls.py
│   ├── requirements/
│   │   ├── base.txt                Production dependencies
│   │   └── dev.txt                 Dev + testing dependencies
│   ├── venv/                       Python virtual environment
│   ├── manage.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env
│
└── frontend/                       ← React + Vite SPA
    ├── src/
    │   ├── api/                    Axios service modules
    │   ├── components/
    │   │   ├── layout/             Sidebar, Header, Layout
    │   │   └── ui/                 Badge, Modal, Spinner, Pagination
    │   ├── context/                AuthContext (JWT state + roles)
    │   ├── pages/                  9 route pages
    │   └── utils/                  Formatters & helpers
    ├── .env                        VITE_API_BASE_URL config
    └── vite.config.js              Dev proxy to backend
```

---

## ⚡ Quick Start

> **Prerequisites:** Python 3.12+, Node.js 18+

### 🔧 Terminal 1 — Start Backend

```bash
cd backend
source venv/bin/activate        # Activate Python virtual environment
python manage.py migrate        # Apply database migrations
python manage.py seed_data      # Load demo users + sample data
python manage.py runserver 0.0.0.0:8000
```

✅ Backend running at **`http://localhost:8000`**

---

### 🎨 Terminal 2 — Start Frontend

```bash
cd frontend
npm install                     # Install Node dependencies (first time only)
npm run dev
```

✅ Frontend running at **`http://localhost:5173`**

---

### 🌐 Open in Browser

| URL | What you'll see |
|-----|----------------|
| **`http://localhost:5173`** | React Dashboard (Login page) |
| `http://localhost:8000/api/docs/` | Swagger UI — Interactive API explorer |
| `http://localhost:8000/api/redoc/` | ReDoc — Clean API reference |
| `http://localhost:8000/admin/` | Django Admin panel |

---

## 🔑 Demo Credentials

The `seed_data` command creates these accounts. On the login page, click any credential button to auto-fill:

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **ADMIN** | `admin@enterprisehub.com` | `admin123` | Full system — all pages, all actions |
| **MANAGER** | `manager@enterprisehub.com` | `manager123` | Dashboard, Stock, Users, Analytics |
| **STAFF** | `staff@enterprisehub.com` | `staff123` | Stock adjustments, Order status updates |
| **CLIENT** | `client@acmecorp.com` | `client123` | Product catalog, Place & cancel orders |

---

## 🎨 Frontend Features

### Pages & Role Access

| Page | Route | ADMIN | MANAGER | STAFF | CLIENT |
|------|-------|:-----:|:-------:|:-----:|:------:|
| Login | `/login` | ✅ | ✅ | ✅ | ✅ |
| Dashboard & Analytics | `/` | ✅ | ✅ | ❌ | ❌ |
| Products (Table + Grid) | `/products` | ✅ | ✅ | ✅ | ✅ |
| Product Detail + Stock Adjust | `/products/:id` | ✅ | ✅ | ✅ | ✅ |
| Categories | `/categories` | ✅ | ✅ | ✅ | ✅ |
| Orders | `/orders` | ✅ | ✅ | ✅ | ✅ |
| Stock Movements Audit | `/stock-movements` | ✅ | ✅ | ✅ | ❌ |
| Users Management | `/users` | ✅ | ✅ | ❌ | ❌ |
| My Profile | `/profile` | ✅ | ✅ | ✅ | ✅ |

### Design System
- 🌑 **Dark-mode glassmorphism** with `#0f1117` base and `#6366f1 → #8b5cf6` accent gradient
- 📐 **Collapsible sidebar** with tooltip support in collapsed mode
- 📊 **Recharts** — Pie, Bar, and Area charts on the analytics dashboard
- 🏷️ **Role-aware badges** — color-coded for every status and role
- 📱 **Fully responsive** — mobile hamburger menu, adaptive grids
- ✨ **Micro-animations** — hover lifts, page transitions, loading spinners
- 🔄 **JWT auto-refresh** — silent token renewal via Axios interceptor

---

## 🏗️ Architecture

### Backend Architecture Highlights

#### 1. Security — JWT + 4-Tier Custom RBAC
```
ADMIN → MANAGER → STAFF → CLIENT
```
- Custom `User` model with `email` as the primary identifier
- Custom permission classes: `IsManagerOrReadOnly`, `IsStaffOrReadOnly`, `IsOwnerOrAdmin`
- SimpleJWT with token blacklisting on rotation

#### 2. Database Performance — N+1 Elimination
```python
# All querysets use select_related + prefetch_related
Order.objects.with_details()  # prefetch_related('items__product')
Product.objects.select_related('category', 'supplier')
```
- Explicit DB indexes on high-cardinality fields (`sku`, `email`, `role`, `status`, `created_at`)
- Real-time ORM aggregations (`Sum`, `Count`, `Avg`, `F()`, `Q()`) computed directly in the database

#### 3. Atomic Checkout Engine
```python
with transaction.atomic():
    locked = Product.objects.select_for_update().filter(id__in=product_ids)
    # Validates stock → deducts inventory → creates order → logs movement
```
- `select_for_update()` row-level locking prevents race conditions and overselling
- Full rollback on any stock failure

#### 4. Async Task Processing
```python
send_order_confirmation_email.delay(order.id)  # Non-blocking
```
- Celery generates mock PDF invoices and sends email notifications post-checkout
- In local dev, tasks run synchronously (`CELERY_TASK_ALWAYS_EAGER = True`)

#### 5. OpenAPI 3.0 Auto-Documentation
- `drf-spectacular` generates the full schema at `/api/schema/`
- Swagger UI at `/api/docs/` — authorize with JWT Bearer token directly in the UI

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/token/` | Obtain JWT access + refresh token | Public |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh expired access token | Public |
| `POST` | `/api/v1/auth/register/` | Register new B2B client account | Public |
| `GET/PUT` | `/api/v1/auth/profile/` | View or update own profile | 🔒 Authenticated |
| `GET` | `/api/v1/auth/users/` | List all system users | 🔒 Manager+ |

### Inventory
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET/POST` | `/api/v1/inventory/products/` | List (filterable) or create products | 🔒 Authenticated |
| `GET/PUT/DELETE` | `/api/v1/inventory/products/{id}/` | Retrieve, update, delete product | 🔒 Authenticated |
| `POST` | `/api/v1/inventory/products/{id}/adjust_stock/` | Atomic stock adjustment with audit | 🔒 Staff+ |
| `GET/POST` | `/api/v1/inventory/categories/` | List or create categories | 🔒 Authenticated |
| `GET` | `/api/v1/inventory/stock-movements/` | Full stock movement audit trail | 🔒 Staff+ |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/orders/orders/` | List orders (Client: own only) | 🔒 Authenticated |
| `POST` | `/api/v1/orders/orders/` | **Atomic checkout** — deducts stock, queues task | 🔒 Authenticated |
| `POST` | `/api/v1/orders/orders/{id}/cancel/` | Cancel order + restore inventory | 🔒 Owner/Admin |
| `PATCH` | `/api/v1/orders/orders/{id}/update_status/` | Update order status | 🔒 Staff+ |

### Analytics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/analytics/dashboard-summary/` | KPIs, top products, stock valuation | 🔒 Manager+ |

---

## 🔐 Authentication Flow

```
User Login (email + password)
        │
        ▼
POST /api/v1/auth/token/
        │
        ▼
Returns { access, refresh }
        │
        ├─→ Stored in localStorage
        │
        ▼
Every API Request: Authorization: Bearer <access_token>
        │
        ├─→ 401 Unauthorized?
        │       │
        │       ▼
        │   POST /api/v1/auth/token/refresh/
        │       │
        │       ├─→ Success → retry original request
        │       └─→ Failure → clear storage → redirect /login
        │
        └─→ 200 OK → return data to UI
```

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# With coverage
pytest --cov=apps --cov-report=term-missing

# Test specific app
pytest apps/orders/tests/
pytest apps/inventory/tests/
pytest apps/authentication/tests/
```

**Test Coverage:**
- ✅ JWT token issuance + User registration
- ✅ Custom QuerySet N+1 verification
- ✅ Atomic stock adjustment
- ✅ `transaction.atomic` order placement + inventory deduction
- ✅ Insufficient stock error handling
- ✅ Dashboard aggregation queries

---

## 🐳 Docker Setup (Full Stack)

```bash
cd backend

# Start all services: Django + PostgreSQL + Memcached + Celery
docker-compose up --build -d

# Seed demo data
docker-compose exec web python manage.py seed_data

# View logs
docker-compose logs -f web

# Stop everything
docker-compose down
```

**Services started by Docker:**

| Service | Port | Description |
|---------|------|-------------|
| `web` | `8000` | Django API server |
| `celery` | — | Celery async worker |
| `db` | `5432` | PostgreSQL 16 |
| `memcached` | `11211` | Memcached cache |

---

## ⚙️ Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `True` | Django debug mode |
| `SECRET_KEY` | `dev-key` | Django secret key (change in production!) |
| `ALLOWED_HOSTS` | `*` | Comma-separated allowed hosts |
| `POSTGRES_DB` | `nexus_inventory_db` | PostgreSQL database name |
| `POSTGRES_USER` | `nexus_admin` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `nexus_password` | PostgreSQL password |
| `POSTGRES_HOST` | `db` | PostgreSQL host |
| `MEMCACHED_HOST` | `127.0.0.1` | Memcached host |
| `CELERY_BROKER_URL` | `memory://` | Celery broker URL |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | `60` | JWT access token TTL |
| `REFRESH_TOKEN_LIFETIME_DAYS` | `7` | JWT refresh token TTL |

---

## 🛠️ Tech Stack Summary

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Django | 5.1 | Web framework |
| djangorestframework | 3.17 | REST API toolkit |
| djangorestframework-simplejwt | 5.5 | JWT authentication |
| drf-spectacular | 0.30 | OpenAPI 3.0 schema generation |
| django-filter | 25.1 | Queryset filtering |
| celery | 5.6 | Async task queue |
| psycopg2-binary | 2.9 | PostgreSQL adapter |
| django-cors-headers | 4.9 | CORS middleware |
| pytest-django | 4.14 | Django test runner |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18 | UI component framework |
| react-router-dom | 6 | Client-side routing |
| axios | latest | HTTP client + interceptors |
| recharts | latest | Dashboard charts |
| lucide-react | latest | Icon library |
| vite | 4 | Build tool & dev server |

---

## 👤 Author

**Divyansh Singh**
- Backend: Django REST API with enterprise patterns
- Frontend: React + Vite dark-mode SPA

---

## 📄 License

This project is for portfolio and educational demonstration purposes.
