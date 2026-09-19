# EnterpriseHub — Backend API

![Django REST Framework](https://img.shields.io/badge/Django_REST_Framework-5.1-red?style=for-the-badge&logo=django)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Multi--Tenant_Ready-blue?style=for-the-badge&logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-SimpleJWT-orange?style=for-the-badge&logo=jsonwebtokens)
![OpenAPI](https://img.shields.io/badge/OpenAPI_3.0-Swagger_UI-green?style=for-the-badge&logo=swagger)
![Pytest](https://img.shields.io/badge/Pytest-100%25_Pass-brightgreen?style=for-the-badge&logo=pytest)

> **High-performance multi-tenant B2B inventory & order engine built with Django REST Framework, custom Role-Based Access Control (RBAC), atomic database transactions, Celery background worker, and ORM query optimizations.**

---

## 🚀 Quick Start

### Step 1 — Activate Virtual Environment
```bash
cd backend
source venv/bin/activate
```

### Step 2 — Setup Environment Variables
```bash
cp .env.example .env
# Edit .env if needed (default works for local SQLite dev)
```

### Step 3 — Run Migrations
```bash
python manage.py migrate
```

### Step 4 — Seed Demo Data
```bash
python manage.py seed_data
```

### Step 5 — Start Development Server
```bash
python manage.py runserver 0.0.0.0:8000
```

**Backend is now running at:** `http://localhost:8000`

---

## 🔗 API Documentation

| URL | Description |
|-----|-------------|
| `http://localhost:8000/api/docs/` | 📄 Swagger UI (Interactive) |
| `http://localhost:8000/api/redoc/` | 📘 ReDoc Documentation |
| `http://localhost:8000/admin/` | 🔧 Django Admin Panel |

---

## 🔑 Demo Login Credentials

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@enterprisehub.com` | `admin123` | `ADMIN` | Full system access |
| `manager@enterprisehub.com` | `manager123` | `MANAGER` | Stock, Users & Analytics |
| `staff@enterprisehub.com` | `staff123` | `STAFF` | Stock adjustments & Order status |
| `client@acmecorp.com` | `client123` | `CLIENT` | Products & Order checkout |

---

## 📂 Folder Structure

```
backend/
├── apps/
│   ├── authentication/     # Custom User Model, JWT, RBAC
│   ├── inventory/          # Products, Categories, Stock Movements
│   ├── orders/             # Atomic Checkout Engine, Celery Tasks
│   └── analytics/          # Real-Time ORM Aggregations Dashboard
├── config/
│   ├── settings/
│   │   ├── base.py         # Core Django & DRF settings
│   │   ├── local.py        # SQLite dev settings
│   │   └── production.py   # PostgreSQL + Security settings
│   ├── celery.py
│   └── urls.py
├── requirements/
│   ├── base.txt            # Production dependencies
│   └── dev.txt             # Dev & testing dependencies
├── scripts/
│   └── entrypoint.sh       # Docker entrypoint
├── venv/                   # Python virtual environment
├── manage.py
├── Dockerfile
├── docker-compose.yml
├── pytest.ini
└── .env
```

---

## 🔑 Key API Endpoints

### Authentication (`/api/v1/auth/`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/v1/auth/token/` | Obtain JWT token pair | Public |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh access token | Public |
| `POST` | `/api/v1/auth/register/` | Register new B2B client | Public |
| `GET/PUT` | `/api/v1/auth/profile/` | Read or update own profile | Authenticated |
| `GET` | `/api/v1/auth/users/` | List all system users | Manager/Admin |

### Inventory (`/api/v1/inventory/`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/inventory/products/` | Filterable product catalog | Authenticated |
| `POST` | `/api/v1/inventory/products/` | Create product | Manager/Admin |
| `POST` | `/api/v1/inventory/products/{id}/adjust_stock/` | Atomic stock adjustment | Staff+ |
| `GET` | `/api/v1/inventory/categories/` | List categories | Authenticated |
| `GET` | `/api/v1/inventory/stock-movements/` | Stock audit trail | Staff+ |

### Orders (`/api/v1/orders/`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/orders/orders/` | List orders | Authenticated |
| `POST` | `/api/v1/orders/orders/` | **Atomic checkout** | Authenticated |
| `POST` | `/api/v1/orders/orders/{id}/cancel/` | Cancel & restore stock | Owner/Admin |
| `PATCH` | `/api/v1/orders/orders/{id}/update_status/` | Update order status | Staff+ |

### Analytics (`/api/v1/analytics/`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/analytics/dashboard-summary/` | Aggregated KPIs & top products | Manager/Admin |

---

## 🏗️ Architecture Highlights

1. **JWT + Custom RBAC** — 4-tier roles: `ADMIN`, `MANAGER`, `STAFF`, `CLIENT`
2. **N+1 Prevention** — `select_related` & `prefetch_related` on all querysets
3. **Atomic Checkout** — `transaction.atomic` + `select_for_update()` row locking
4. **Celery Tasks** — Async email & invoice generation on order placement
5. **ORM Aggregations** — `Sum`, `Count`, `Avg`, `F()`, `Q()` — zero Python memory row load
6. **OpenAPI 3.0** — Auto-generated Swagger docs via `drf-spectacular`

---

## 🧪 Running Tests

```bash
# Activate venv first
source venv/bin/activate

# Run full test suite
pytest

# With coverage report
pytest --cov=apps --cov-report=term-missing

# Run specific app tests
pytest apps/orders/tests/
```

---

## 🐳 Docker Setup (Full Stack)

```bash
# Build and start all services (Django + PostgreSQL + Memcached + Celery)
cd backend
docker-compose up --build -d

# Seed demo data inside container
docker-compose exec web python manage.py seed_data
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `True` | Django debug mode |
| `SECRET_KEY` | `dev-key` | Django secret key |
| `POSTGRES_DB` | `nexus_inventory_db` | PostgreSQL database name |
| `POSTGRES_USER` | `nexus_admin` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `nexus_password` | PostgreSQL password |
| `POSTGRES_HOST` | `db` | PostgreSQL host |
| `CELERY_BROKER_URL` | `memory://` | Celery broker |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | `60` | JWT access token TTL |
| `REFRESH_TOKEN_LIFETIME_DAYS` | `7` | JWT refresh token TTL |
