from decimal import Decimal
import pytest
from django.urls import reverse
from rest_framework import status
from apps.authentication.models import User, UserRole
from apps.inventory.models import Category, Product, StockMovement
from apps.orders.models import Order, OrderStatus


@pytest.fixture
def client_user(db):
    return User.objects.create_user(
        email='client@company.com',
        password='password123',
        role=UserRole.CLIENT
    )


@pytest.fixture
def sample_products(db):
    cat = Category.objects.create(name='Components')
    p1 = Product.objects.create(
        sku='SKU-ORD-01', name='Item 1', category=cat, price=Decimal('100.00'), cost_price=Decimal('50.00'), quantity_in_stock=20
    )
    p2 = Product.objects.create(
        sku='SKU-ORD-02', name='Item 2', category=cat, price=Decimal('50.00'), cost_price=Decimal('20.00'), quantity_in_stock=10
    )
    return p1, p2


@pytest.mark.django_db
class TestOrders:

    def test_atomic_checkout_success(self, api_client, client_user, sample_products):
        api_client.force_authenticate(user=client_user)
        p1, p2 = sample_products
        url = reverse('orders:order-list')

        payload = {
            'shipping_address': '456 Warehouse Blvd',
            'notes': 'Deliver before 5 PM',
            'items': [
                {'product_id': p1.id, 'quantity': 2},
                {'product_id': p2.id, 'quantity': 3}
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['total_amount'] == '350.00'  # (2*100) + (3*50) = 350

        # Verify stock deduction
        p1.refresh_from_db()
        p2.refresh_from_db()
        assert p1.quantity_in_stock == 18
        assert p2.quantity_in_stock == 7

        # Verify stock movement logged
        assert StockMovement.objects.filter(product=p1, quantity=-2).exists()

    def test_checkout_fails_on_insufficient_stock(self, api_client, client_user, sample_products):
        api_client.force_authenticate(user=client_user)
        p1, _ = sample_products
        url = reverse('orders:order-list')

        payload = {
            'shipping_address': '789 Main St',
            'items': [
                {'product_id': p1.id, 'quantity': 500}  # Available is 20
            ]
        }

        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert p1.quantity_in_stock == 20  # Unchanged
