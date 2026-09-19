from django.db.models import Sum, Count, Avg, F, Q, ExpressionWrapper, DecimalField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema

from apps.authentication.permissions import IsManagerRole
from apps.inventory.models import Product
from apps.orders.models import Order, OrderItem, OrderStatus


class DashboardSummaryView(APIView):
    """
    High-Performance Real-Time Analytics Dashboard summary API.
    Utilizes Django ORM DB Aggregations (Sum, Count, Avg, F expressions) to calculate 
    metrics directly in PostgreSQL with 0 row load memory footprint in Python.
    """
    permission_classes = [IsManagerRole]

    @extend_schema(
        tags=['Analytics'],
        summary="Retrieve real-time sales, order stats, and stock valuation metrics",
        responses={200: dict}
    )
    def get(self, request):
        # 1. Order & Sales Aggregations
        order_stats = Order.objects.aggregate(
            total_orders=Count('id'),
            completed_orders=Count('id', filter=Q(status=OrderStatus.COMPLETED)),
            pending_orders=Count('id', filter=Q(status=OrderStatus.PENDING)),
            cancelled_orders=Count('id', filter=Q(status=OrderStatus.CANCELLED)),
            total_revenue=Sum('total_amount', filter=Q(status__in=[OrderStatus.COMPLETED, OrderStatus.PROCESSING, OrderStatus.PENDING])),
            average_order_value=Avg('total_amount', filter=Q(status__in=[OrderStatus.COMPLETED, OrderStatus.PROCESSING]))
        )

        # 2. Product Inventory Aggregations
        inventory_stats = Product.objects.aggregate(
            total_products=Count('id'),
            active_products=Count('id', filter=Q(is_active=True)),
            low_stock_products=Count('id', filter=Q(quantity_in_stock__lte=F('reorder_level'), quantity_in_stock__gt=0)),
            out_of_stock_products=Count('id', filter=Q(quantity_in_stock__lte=0)),
            total_stock_cost_value=Sum(ExpressionWrapper(F('quantity_in_stock') * F('cost_price'), output_field=DecimalField())),
            total_stock_retail_value=Sum(ExpressionWrapper(F('quantity_in_stock') * F('price'), output_field=DecimalField()))
        )

        # 3. Top 5 Selling Products Aggregations
        top_products = OrderItem.objects.values(
            'product__id', 'product__sku', 'product__name'
        ).annotate(
            total_quantity_sold=Sum('quantity'),
            total_revenue_generated=Sum('subtotal')
        ).order_by('-total_quantity_sold')[:5]

        data = {
            'overview': {
                'total_revenue': order_stats['total_revenue'] or 0.00,
                'average_order_value': order_stats['average_order_value'] or 0.00,
                'total_orders': order_stats['total_orders'] or 0,
                'completed_orders': order_stats['completed_orders'] or 0,
                'pending_orders': order_stats['pending_orders'] or 0,
                'cancelled_orders': order_stats['cancelled_orders'] or 0,
            },
            'inventory_metrics': {
                'total_products': inventory_stats['total_products'] or 0,
                'active_products': inventory_stats['active_products'] or 0,
                'low_stock_products': inventory_stats['low_stock_products'] or 0,
                'out_of_stock_products': inventory_stats['out_of_stock_products'] or 0,
                'total_stock_cost_value': inventory_stats['total_stock_cost_value'] or 0.00,
                'total_stock_retail_value': inventory_stats['total_stock_retail_value'] or 0.00,
            },
            'top_selling_products': list(top_products)
        }

        return Response(data, status=status.HTTP_200_OK)
