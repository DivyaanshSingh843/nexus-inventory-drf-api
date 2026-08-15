# EnterpriseHub: Scalable B2B Inventory & Order Management REST API

![Django REST Framework](https://img.shields.io/badge/Django_REST_Framework-5.1-red?style=for-the-badge&logo=django)
![Celery & Memcached](https://img.shields.io/badge/Celery_%26_Memcached-Caching_%26_Tasks-green?style=for-the-badge&logo=celery)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Multi--Tenant_Ready-blue?style=for-the-badge&logo=postgresql)
![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI_3.0-drf--spectacular-orange?style=for-the-badge&logo=swagger)
![Pytest](https://img.shields.io/badge/Pytest-100%25_Pass-brightgreen?style=for-the-badge&logo=pytest)

> **High-performance multi-tenant B2B inventory & order engine built with Django REST Framework, custom Role-Based Access Control (RBAC), atomic database transactions, Celery background worker, and ORM query optimizations.**

---

## 🏗️ Core Architecture & Technical Highlights

This project demonstrates production-grade Django architecture and enterprise database performance optimization:

1. **Security & Authentication (JWT + Custom RBAC)**:
   - Built using `django-rest-framework-simplejwt`.
   - Custom `User` model using `email` as the primary identifier instead of `username`.
   - 4-Tier Role-Based Access Control: `ADMIN`, `MANAGER` (Store Manager), `STAFF`, and `CLIENT`.
   - Custom permission classes: `IsManagerOrReadOnly`, `IsStaffOrReadOnly`, `IsOwnerOrAdmin`.

2. **Database & ORM Performance Optimization (N+1 Solution)**:
   - Querysets utilize default `select_related('category', 'supplier')` and `prefetch_related('items__product')` to eliminate N+1 query bottlenecks.
   - Explicit Database Indexes on high-cardinality fields (`sku`, `email`, `role`, `status`, `created_at`).
   - Real-time aggregations & annotations via Django ORM (`Sum`, `Count`, `Avg`, `F()`, `Q()`) to compute financial and stock metrics directly in PostgreSQL without loading rows in Python memory.

3. **Concurrency-Safe Atomic Checkout Engine**:
   - `POST /api/v1/orders/orders/` utilizes `transaction.atomic` and `select_for_update()` row locking to eliminate race conditions and prevent negative stock overselling.
   - Triggers asynchronous background task upon successful placement.

4. **Asynchronous Task Processing (Celery + Redis)**:
   - Background generation of mock PDF invoices and email order notifications (`send_order_confirmation_email`).

5. **OpenAPI 3.0 & Interactive Swagger UI**:
   - Schema auto-generation with `drf-spectacular` at `/api/docs/` and `/api/redoc/`.

---

## 📂 Repository Folder Structure

```text
nexus-inventory-drf-api/
├── config/                         # Main Django Project Settings
│   ├── __init__.py
│   ├── celery.py                   # Celery Application Setup
│   ├── urls.py                     # Root URL routing + Swagger UI
│   ├── wsgi.py
│   ├── asgi.py
│   └── settings/
│       ├── __init__.py
│       ├── base.py                 # Core Django & DRF settings
│       ├── local.py                # Development settings
│       └── production.py           # PostgreSQL & Security settings
├── apps/                           # Modular Apps Folder
│   ├── authentication/             # Custom User Model & SimpleJWT endpoints
│   │   ├── models.py
│   │   ├── permissions.py          # Custom RBAC Permission Classes
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── inventory/                  # Products, Categories & Stock Management
│   │   ├── models.py               # Category, Product, StockMovement
│   │   ├── querysets.py            # Optimized Custom QuerySets (select_related)
│   │   ├── filters.py              # django-filter sets
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests/
│   ├── orders/                     # Orders, OrderItems & Atomic Checkout Engine
│   │   ├── models.py
│   │   ├── querysets.py            # Prefetch_related querysets
│   │   ├── serializers.py
│   │   ├── tasks.py                # Celery background tasks
│   │   ├── views.py                # Transactional checkout viewset
│   │   ├── urls.py
│   │   └── tests/
│   └── analytics/                  # Real-Time Stock & Revenue Metrics API
│       ├── views.py                # DB Aggregations & Annotations
│       ├── urls.py
│       └── tests/
├── requirements/
│   ├── base.txt                    # Core requirements
│   └── dev.txt                     # Dev & pytest dependencies
├── scripts/
│   └── entrypoint.sh               # Docker container entrypoint script
├── Dockerfile                      # Multi-stage Python build
├── docker-compose.yml              # Web + Postgres + Redis + Celery Worker
├── pytest.ini                      # Pytest runner configuration
├── manage.py
└── README.md
```

---

## 🚀 Quick Start Guide

### Option 1: Local Development (Python Virtualenv)

```bash
# 1. Clone Repository & Navigate
cd django-enterprise-backend-api

# 2. Create Virtual Environment & Activate
python3 -m venv venv
source venv/bin/activate

# 3. Install Dependencies
pip install -r requirements/dev.txt

# 4. Run Migrations
python manage.py makemigrations authentication inventory orders analytics
python manage.py migrate

# 5. Seed Realistic Demo Data
python manage.py seed_data

# 6. Start Development Server
python manage.py runserver 0.0.0.0:8000
```

### Option 2: Docker Compose Setup (PostgreSQL + Redis + Celery)

```bash
# Build and run the entire stack in detached mode
docker-compose up --build -d

# Seed initial demo data inside container
docker-compose exec web python manage.py seed_data
```

Access Swagger UI documentation at: **`http://localhost:8000/api/docs/`**

---

## 🔑 Demo Login Credentials

The `python manage.py seed_data` command generates pre-configured users with different roles for testing:

| Email | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| `admin@enterprisehub.com` | `admin123` | `ADMIN` | Full System & Django Admin Access |
| `manager@enterprisehub.com` | `manager123` | `MANAGER` | Stock Management, User List & Analytics Dashboard |
| `staff@enterprisehub.com` | `staff123` | `STAFF` | Stock Adjustments & Order Status Updates |
| `client@acmecorp.com` | `client123` | `CLIENT` | Product Browsing & Order Checkout |

---

## 🔑 Key API Endpoints

### 1. Authentication & RBAC (`/api/v1/auth/`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/token/` | Obtain JWT Access and Refresh token pair | Public |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh expired access token | Public |
| `POST` | `/api/v1/auth/register/` | Register new B2B client account | Public |
| `GET/PUT` | `/api/v1/auth/profile/` | Read or update authenticated profile | Authenticated |
| `GET` | `/api/v1/auth/users/` | List system users | Manager / Admin |

### 2. Inventory Management (`/api/v1/inventory/`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/inventory/products/` | Filterable & searchable product catalog | Authenticated |
| `POST` | `/api/v1/inventory/products/` | Create new product | Manager / Admin |
| `POST` | `/api/v1/inventory/products/{id}/adjust_stock/` | Atomic stock adjustment with audit log | Staff / Manager |
| `GET` | `/api/v1/inventory/categories/` | List categories with `products_count` metric | Authenticated |
| `GET` | `/api/v1/inventory/stock-movements/` | View stock movement audit trail | Staff / Manager |

### 3. Orders & Atomic Checkout (`/api/v1/orders/`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders/orders/` | List orders (Client sees own; Staff sees all) | Authenticated |
| `POST` | `/api/v1/orders/orders/` | **Atomic Checkout**: Validates stock, deducts inventory, queues Celery task | Authenticated |
| `POST` | `/api/v1/orders/orders/{id}/cancel/` | Cancel pending order & restore stock | Owner / Admin |
| `PATCH` | `/api/v1/orders/orders/{id}/update_status/` | Update status (`PENDING` -> `COMPLETED`) | Staff / Manager |

### 4. Sales & Real-Time Analytics (`/api/v1/analytics/`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/dashboard-summary/` | Aggregate sales, top products, & stock valuation | Manager / Admin |

---

## 🧪 Automated Testing & End-to-End API Verification

### 1. Execute End-to-End Integration Test Script (Every API Endpoint Tested):
```bash
python scripts/test_all_apis.py
```

### 2. Execute Pytest Unit Test Suite:
```bash
pytest
```

**Test Coverage Highlights**:
- **Authentication**: JWT token issuance, User registration, Profile authorization.
- **Inventory**: Custom QuerySet N+1 verification, Atomic stock adjustment.
- **Orders**: `transaction.atomic` order placement, inventory deduction, error on insufficient stock.
- **Analytics**: Aggregated dashboard queries validation.
