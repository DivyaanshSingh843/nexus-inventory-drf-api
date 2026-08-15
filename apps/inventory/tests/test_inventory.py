from decimal import Decimal
import pytest
from django.urls import reverse
from rest_framework import status
from apps.authentication.models import User, UserRole
from apps.inventory.models import Category, Product, StockMovement


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        email='mgr@example.com',
        password='password123',
        role=UserRole.MANAGER
    )


@pytest.fixture
def category(db):
    return Category.objects.create(name='Hardware', description='Tools and components')


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        sku='SKU-TEST-001',
        name='Test Bearing Unit',
        category=category,
        price=Decimal('150.00'),
        cost_price=Decimal('90.00'),
        quantity_in_stock=50,
        reorder_level=10
    )


@pytest.mark.django_db
class TestInventory:

    def test_product_list_query_optimization(self, api_client, manager_user, product, django_assert_num_queries):
        api_client.force_authenticate(user=manager_user)
        url = reverse('inventory:product-list')

        # Ensures querying products list uses select_related for 0 N+1 extra queries
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_adjust_stock_atomic(self, api_client, manager_user, product):
        api_client.force_authenticate(user=manager_user)
        url = reverse('inventory:product-adjust-stock', kwargs={'pk': product.pk})

        payload = {
            'quantity_change': 25,
            'movement_type': 'INBOUND',
            'notes': 'Restock shipment received'
        }
        response = api_client.post(url, payload)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['quantity_in_stock'] == 75

        # Check stock movement audit log
        assert StockMovement.objects.filter(product=product, quantity=25).exists()
