from decimal import Decimal
import pytest
from django.urls import reverse
from rest_framework import status
from apps.authentication.models import User, UserRole
from apps.inventory.models import Category, Product
from apps.orders.models import Order, OrderItem, OrderStatus


@pytest.fixture
def manager(db):
    return User.objects.create_user(
        email='manager_analytics@example.com',
        password='password123',
        role=UserRole.MANAGER
    )


@pytest.fixture
def client(db):
    return User.objects.create_user(
        email='client_analytics@example.com',
        password='password123',
        role=UserRole.CLIENT
    )


@pytest.mark.django_db
class TestAnalytics:

    def test_dashboard_summary_requires_manager(self, api_client, client):
        api_client.force_authenticate(user=client)
        url = reverse('analytics:dashboard_summary')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_dashboard_summary_success(self, api_client, manager, client):
        api_client.force_authenticate(user=manager)
        cat = Category.objects.create(name='Widget')
        p = Product.objects.create(
            sku='P1', name='Widget 1', category=cat, price=Decimal('100.00'), cost_price=Decimal('60.00'), quantity_in_stock=5
        )
        Order.objects.create(
            order_number='ORD-DASH-1', client=client, status=OrderStatus.COMPLETED, total_amount=Decimal('500.00'), shipping_address='Addr'
        )

        url = reverse('analytics:dashboard_summary')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'overview' in response.data
        assert 'inventory_metrics' in response.data
        assert response.data['overview']['total_orders'] == 1
        assert response.data['inventory_metrics']['total_products'] == 1
