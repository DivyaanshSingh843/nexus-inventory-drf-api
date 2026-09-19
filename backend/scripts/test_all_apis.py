import os
import sys
import django

# Setup Django Environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.core.management import call_command
from rest_framework.test import APIClient
from apps.authentication.models import User, UserRole
from apps.inventory.models import Category, Product, StockMovement
from apps.orders.models import Order, OrderItem, OrderStatus

def print_banner(text):
    print(f"\n=======================================================")
    print(f"  {text}")
    print(f"=======================================================")

def main():
    print_banner("RUNNING DATABASE MIGRATIONS AND SEED DATA")
    call_command('migrate', interactive=False)
    call_command('seed_data')

    client = APIClient()
    
    # ----------------------------------------------------
    # 1. AUTHENTICATION APIs (/api/v1/auth/)
    # ----------------------------------------------------
    print_banner("1. TESTING AUTHENTICATION & RBAC APIs")

    # 1a. Register Client User
    User.objects.filter(email='api_test_client@enterprise.com').delete()
    reg_url = '/api/v1/auth/register/'
    reg_data = {
        'email': 'api_test_client@enterprise.com',
        'password': 'password123',
        'password_confirm': 'password123',
        'first_name': 'API',
        'last_name': 'Tester',
        'company_name': 'Testing Co'
    }
    r = client.post(reg_url, reg_data, format='json')
    assert r.status_code == 201, f"Register failed: {r.data}"
    print(f"✔ POST {reg_url} -> 201 CREATED (Registered User: {r.data['email']})")

    # 1b. Login with Admin
    login_url = '/api/v1/auth/token/'
    r_admin = client.post(login_url, {'email': 'admin@enterprisehub.com', 'password': 'admin123'})
    assert r_admin.status_code == 200, f"Admin login failed: {r_admin.data}"
    admin_token = r_admin.data['access']
    refresh_token = r_admin.data['refresh']
    print(f"✔ POST {login_url} -> 200 OK (Admin JWT token obtained)")

    # 1c. Refresh Token
    ref_url = '/api/v1/auth/token/refresh/'
    r_ref = client.post(ref_url, {'refresh': refresh_token})
    assert r_ref.status_code == 200, f"Token refresh failed: {r_ref.data}"
    print(f"✔ POST {ref_url} -> 200 OK (Token refreshed successfully)")

    # 1d. Login with Manager & Client
    r_mgr = client.post(login_url, {'email': 'manager@enterprisehub.com', 'password': 'manager123'})
    mgr_token = r_mgr.data['access']

    r_cli = client.post(login_url, {'email': 'api_test_client@enterprise.com', 'password': 'password123'})
    cli_token = r_cli.data['access']

    # 1e. Get Profile (Authenticated Client)
    profile_url = '/api/v1/auth/profile/'
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + cli_token)
    r_prof = client.get(profile_url)
    assert r_prof.status_code == 200, f"Profile get failed: {r_prof.data}"
    print(f"✔ GET {profile_url} -> 200 OK (Profile retrieved for {r_prof.data['email']})")

    # 1f. Update Profile
    r_update_prof = client.put(profile_url, {
        'first_name': 'API Updated',
        'last_name': 'Tester',
        'company_name': 'Updated Corp'
    }, format='json')
    assert r_update_prof.status_code == 200
    print(f"✔ PUT {profile_url} -> 200 OK (Profile name updated: {r_update_prof.data['first_name']})")

    # 1g. User List (Permission check: Client forbidden, Manager allowed)
    users_url = '/api/v1/auth/users/'
    r_cli_users = client.get(users_url)
    assert r_cli_users.status_code == 403, "Client should be forbidden from listing users"
    print(f"✔ GET {users_url} [as Client] -> 403 FORBIDDEN (RBAC check passed)")

    client.credentials(HTTP_AUTHORIZATION='Bearer ' + mgr_token)
    r_mgr_users = client.get(users_url)
    assert r_mgr_users.status_code == 200
    print(f"✔ GET {users_url} [as Manager] -> 200 OK (Retrieved {len(r_mgr_users.data['results'])} users)")

    # ----------------------------------------------------
    # 2. INVENTORY APIs (/api/v1/inventory/)
    # ----------------------------------------------------
    print_banner("2. TESTING INVENTORY APIs")

    # 2a. List Categories
    cats_url = '/api/v1/inventory/categories/'
    r_cats = client.get(cats_url)
    assert r_cats.status_code == 200
    print(f"✔ GET {cats_url} -> 200 OK (Categories count: {len(r_cats.data['results'])})")

    # 2b. Create Category
    Category.objects.filter(name='Pneumatic Controls').delete()
    r_new_cat = client.post(cats_url, {
        'name': 'Pneumatic Controls',
        'description': 'Valves and solenoids for industrial automation'
    }, format='json')
    assert r_new_cat.status_code == 201
    cat_id = r_new_cat.data['id']
    print(f"✔ POST {cats_url} -> 201 CREATED (Created category: {r_new_cat.data['name']})")

    # 2c. Create Product
    prods_url = '/api/v1/inventory/products/'
    r_new_prod = client.post(prods_url, {
        'sku': 'SKU-PNEU-901',
        'name': 'High-Pressure Solenoid Valve 24V',
        'description': 'Heavy duty pneumatic valve',
        'category_id': cat_id,
        'price': '320.00',
        'cost_price': '190.00',
        'quantity_in_stock': 15,
        'reorder_level': 5,
        'is_active': True
    }, format='json')
    assert r_new_prod.status_code == 201
    prod_id = r_new_prod.data['id']
    print(f"✔ POST {prods_url} -> 201 CREATED (Product: {r_new_prod.data['name']}, SKU: {r_new_prod.data['sku']})")

    # 2d. Filter Products (Search & Filter)
    r_filter = client.get(f"{prods_url}?search=Solenoid&min_price=100")
    assert r_filter.status_code == 200
    assert len(r_filter.data['results']) >= 1
    print(f"✔ GET {prods_url}?search=Solenoid -> 200 OK (Filtered results: {len(r_filter.data['results'])})")

    # 2e. Retrieve Product Detail
    r_prod_detail = client.get(f"{prods_url}{prod_id}/")
    assert r_prod_detail.status_code == 200
    print(f"✔ GET {prods_url}{prod_id}/ -> 200 OK (Product Stock: {r_prod_detail.data['quantity_in_stock']})")

    # 2f. Adjust Stock (Atomic Stock Update + Audit Log)
    adjust_url = f"{prods_url}{prod_id}/adjust_stock/"
    r_adjust = client.post(adjust_url, {
        'quantity_change': 35,
        'movement_type': 'INBOUND',
        'reference': 'PO-TEST-8899',
        'notes': 'Restock shipment received from supplier'
    }, format='json')
    assert r_adjust.status_code == 200
    assert r_adjust.data['quantity_in_stock'] == 50
    print(f"✔ POST {adjust_url} -> 200 OK (Stock updated from 15 to {r_adjust.data['quantity_in_stock']})")

    # 2g. List Stock Movements Audit Logs
    movements_url = '/api/v1/inventory/stock-movements/'
    r_mov = client.get(movements_url)
    assert r_mov.status_code == 200
    print(f"✔ GET {movements_url} -> 200 OK (Total audit log entries: {len(r_mov.data['results'])})")

    # ----------------------------------------------------
    # 3. ORDERS & ATOMIC CHECKOUT APIs (/api/v1/orders/)
    # ----------------------------------------------------
    print_banner("3. TESTING TRANSACTIONAL ORDERS & CHECKOUT APIs")

    # Switch back to Client authentication
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + cli_token)

    orders_url = '/api/v1/orders/orders/'
    # 3a. Create Order (Atomic Checkout)
    checkout_data = {
        'shipping_address': '777 Tech Park Drive, Innovation Zone',
        'notes': 'Fragile shipment - handle with care',
        'items': [
            {'product_id': prod_id, 'quantity': 5}
        ]
    }
    r_order = client.post(orders_url, checkout_data, format='json')
    assert r_order.status_code == 201, f"Checkout failed: {r_order.data}"
    order_id = r_order.data['id']
    order_number = r_order.data['order_number']
    print(f"✔ POST {orders_url} -> 201 CREATED (Placed Order #{order_number}, Total: ${r_order.data['total_amount']})")

    # Verify Stock Deduction
    r_prod_check = client.get(f"{prods_url}{prod_id}/")
    assert r_prod_check.data['quantity_in_stock'] == 45  # 50 - 5 = 45
    print(f"✔ Stock Deduction Verification -> Product stock correctly reduced from 50 to 45!")

    # 3b. Get Order Detail
    r_ord_detail = client.get(f"{orders_url}{order_id}/")
    assert r_ord_detail.status_code == 200
    assert len(r_ord_detail.data['items']) == 1
    print(f"✔ GET {orders_url}{order_id}/ -> 200 OK (Order items count: {len(r_ord_detail.data['items'])})")

    # 3c. Cancel Order & Verify Stock Restoration
    cancel_url = f"{orders_url}{order_id}/cancel/"
    r_cancel = client.post(cancel_url)
    assert r_cancel.status_code == 200
    assert r_cancel.data['status'] == 'CANCELLED'
    print(f"✔ POST {cancel_url} -> 200 OK (Order #{order_number} cancelled)")

    r_prod_restored = client.get(f"{prods_url}{prod_id}/")
    assert r_prod_restored.data['quantity_in_stock'] == 50
    print(f"✔ Stock Restoration Verification -> Stock automatically restored back to 50!")

    # 3d. Create Second Order and Update Status as Manager
    r_order2 = client.post(orders_url, checkout_data, format='json')
    order2_id = r_order2.data['id']

    client.credentials(HTTP_AUTHORIZATION='Bearer ' + mgr_token)
    update_status_url = f"{orders_url}{order2_id}/update_status/"
    r_status = client.patch(update_status_url, {'status': 'COMPLETED'}, format='json')
    assert r_status.status_code == 200
    assert r_status.data['status'] == 'COMPLETED'
    print(f"✔ PATCH {update_status_url} -> 200 OK (Order status updated to COMPLETED)")

    # ----------------------------------------------------
    # 4. ANALYTICS & DASHBOARD SUMMARY (/api/v1/analytics/)
    # ----------------------------------------------------
    print_banner("4. TESTING REAL-TIME ANALYTICS DASHBOARD API")

    dash_url = '/api/v1/analytics/dashboard-summary/'
    r_dash = client.get(dash_url)
    assert r_dash.status_code == 200
    print(f"✔ GET {dash_url} -> 200 OK")
    print(f"   - Total Revenue:         ${r_dash.data['overview']['total_revenue']}")
    print(f"   - Total Orders:          {r_dash.data['overview']['total_orders']}")
    print(f"   - Completed Orders:      {r_dash.data['overview']['completed_orders']}")
    print(f"   - Total Products:        {r_dash.data['inventory_metrics']['total_products']}")
    print(f"   - Stock Retail Value:    ${r_dash.data['inventory_metrics']['total_stock_retail_value']}")

    # ----------------------------------------------------
    # 5. OPENAPI & SWAGGER DOCUMENTATION
    # ----------------------------------------------------
    print_banner("5. TESTING OPENAPI & SWAGGER DOCS")

    r_schema = client.get('/api/schema/')
    assert r_schema.status_code == 200
    print(f"✔ GET /api/schema/ -> 200 OK (OpenAPI JSON schema generated)")

    r_docs = client.get('/api/docs/')
    assert r_docs.status_code == 200
    print(f"✔ GET /api/docs/ -> 200 OK (Swagger UI documentation rendered)")

    print_banner("ALL APIs AND SERVICES TESTED SUCCESSFULLY WITH 100% PASS RATE!")

if __name__ == '__main__':
    main()
