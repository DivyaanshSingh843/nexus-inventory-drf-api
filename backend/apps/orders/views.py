from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.authentication.permissions import IsStaffOrReadOnly, IsOwnerOrAdmin
from apps.inventory.models import Product, StockMovement, StockMovementType
from .models import Order, OrderItem, OrderStatus
from .serializers import (
    OrderDetailSerializer,
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
)
from .tasks import send_order_confirmation_email


@extend_schema(tags=['Orders'])
class OrderViewSet(viewsets.ModelViewSet):
    """
    Transactional order processing engine.
    Supports atomic checkout, concurrent inventory protection, and Celery background notifications.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['order_number', 'client__email', 'shipping_address']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()
        user = self.request.user
        # Base QuerySet with prefetch_related for 0 extra queries (N+1 solution)
        qs = Order.objects.with_details()
        if user.is_staff_role:
            return qs.all()
        return qs.for_client(user)

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderDetailSerializer

    @extend_schema(
        request=OrderCreateSerializer,
        responses={201: OrderDetailSerializer},
        description="Place a new order within an atomic DB transaction. Automatically deducts inventory stock and queues async email task."
    )
    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items_data = serializer.validated_data['items']
        shipping_address = serializer.validated_data['shipping_address']
        notes = serializer.validated_data.get('notes', '')

        product_ids = [item['product_id'] for item in items_data]

        with transaction.atomic():
            # Atomically lock product rows to eliminate race condition stock overselling
            locked_products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # Final stock double check under row lock
            total_order_amount = Decimal('0.00')
            order_items_to_create = []

            order = Order.objects.create(
                order_number=Order.generate_order_number(),
                client=request.user,
                status=OrderStatus.PENDING,
                shipping_address=shipping_address,
                notes=notes,
                total_amount=Decimal('0.00')
            )

            for item_data in items_data:
                product = locked_products[item_data['product_id']]
                qty = item_data['quantity']

                if product.quantity_in_stock < qty:
                    # Rolling back atomic block
                    transaction.set_rollback(True)
                    return Response(
                        {"error": f"Insufficient stock for '{product.name}' during atomic lock verification."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                unit_price = product.price
                subtotal = unit_price * qty
                total_order_amount += subtotal

                # Create OrderItem
                order_items_to_create.append(
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=qty,
                        unit_price=unit_price,
                        subtotal=subtotal
                    )
                )

                # Deduct Stock
                product.quantity_in_stock -= qty
                product.save(update_fields=['quantity_in_stock', 'updated_at'])

                # Log Outbound Stock Movement
                StockMovement.objects.create(
                    product=product,
                    movement_type=StockMovementType.OUTBOUND,
                    quantity=-qty,
                    reference=f"Order #{order.order_number}",
                    performed_by=request.user,
                    notes=f"Order checkout by {request.user.email}"
                )

            # Bulk create order items
            OrderItem.objects.bulk_create(order_items_to_create)

            # Save total order amount
            order.total_amount = total_order_amount
            order.save(update_fields=['total_amount'])

        # Trigger Celery background task for email & invoice generation
        send_order_confirmation_email.delay(order.id)

        # Return full detailed order representation
        result_qs = Order.objects.with_details().get(id=order.id)
        return Response(OrderDetailSerializer(result_qs).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=OrderStatusUpdateSerializer,
        responses={200: OrderDetailSerializer},
        description="Update order status (Staff / Admin only)."
    )
    @action(detail=True, methods=['patch'], permission_classes=[IsStaffOrReadOnly])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data['status']
        order.save(update_fields=['status', 'updated_at'])
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_200_OK)

    @extend_schema(
        responses={200: OrderDetailSerializer},
        description="Cancel pending/processing order and restore inventory stock."
    )
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status == OrderStatus.CANCELLED:
            return Response({"message": "Order is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        if order.status == OrderStatus.COMPLETED:
            return Response({"error": "Cannot cancel completed order."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order.status = OrderStatus.CANCELLED
            order.save(update_fields=['status', 'updated_at'])

            # Restore stock for each item
            for item in order.items.select_related('product').all():
                product = Product.objects.select_for_update().get(id=item.product.id)
                product.quantity_in_stock += item.quantity
                product.save(update_fields=['quantity_in_stock', 'updated_at'])

                StockMovement.objects.create(
                    product=product,
                    movement_type=StockMovementType.INBOUND,
                    quantity=item.quantity,
                    reference=f"Cancellation #{order.order_number}",
                    performed_by=request.user,
                    notes=f"Stock restored due to order cancellation"
                )

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_200_OK)
