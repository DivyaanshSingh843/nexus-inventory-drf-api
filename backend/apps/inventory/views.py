from django.db import transaction
from django.db.models import Count, F
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.authentication.permissions import IsManagerOrReadOnly, IsStaffOrReadOnly
from .models import Category, Product, StockMovement, StockMovementType
from .filters import ProductFilter
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    StockMovementSerializer,
    StockAdjustmentSerializer,
)


@extend_schema(tags=['Inventory'])
class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing product categories with product count metrics.
    """
    queryset = Category.objects.annotate(products_count=Count('products')).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsManagerOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


@extend_schema(tags=['Inventory'])
class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing products.
    Uses ORM select_related('category') to prevent N+1 queries.
    """
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'price', 'quantity_in_stock', 'created_at']

    def get_queryset(self):
        # Heavy use of optimized custom queryset select_related
        return Product.objects.with_category().all()

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return ProductDetailSerializer
        return ProductListSerializer

    @extend_schema(
        request=StockAdjustmentSerializer,
        responses={200: ProductDetailSerializer},
        description="Adjust inventory stock level atomically and log StockMovement audit trail."
    )
    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrReadOnly])
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity_change = serializer.validated_data['quantity_change']
        movement_type = serializer.validated_data['movement_type']
        reference = serializer.validated_data.get('reference', 'Manual Adjustment')
        notes = serializer.validated_data.get('notes', '')

        with transaction.atomic():
            # Lock the row for update to prevent concurrent race conditions
            locked_product = Product.objects.select_for_update().get(pk=product.pk)

            new_quantity = locked_product.quantity_in_stock + quantity_change
            if new_quantity < 0:
                return Response(
                    {"error": f"Cannot deduct stock below 0. Current stock is {locked_product.quantity_in_stock}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            locked_product.quantity_in_stock = new_quantity
            locked_product.save(update_fields=['quantity_in_stock', 'updated_at'])

            # Log stock movement entry
            StockMovement.objects.create(
                product=locked_product,
                movement_type=movement_type,
                quantity=quantity_change,
                reference=reference,
                performed_by=request.user,
                notes=notes
            )

        updated_serializer = ProductDetailSerializer(locked_product)
        return Response(updated_serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Inventory'])
class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for auditing stock movement logs.
    Utilizes select_related('product', 'performed_by') for zero N+1 overhead.
    """
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product', 'movement_type']
    ordering_fields = ['created_at', 'quantity']

    def get_queryset(self):
        return StockMovement.objects.select_related('product', 'performed_by').all()
