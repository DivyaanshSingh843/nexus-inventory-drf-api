from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Category, Product, StockMovement, StockMovementType


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'products_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'sku', 'name', 'category', 'category_name',
            'price', 'cost_price', 'quantity_in_stock', 'reorder_level',
            'is_active', 'is_low_stock', 'created_at'
        )
        read_only_fields = ('id', 'is_low_stock', 'created_at')


class StockMovementSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.EmailField(source='performed_by.email', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = StockMovement
        fields = (
            'id', 'product', 'product_sku', 'movement_type', 'quantity',
            'reference', 'performed_by', 'performed_by_email', 'notes', 'created_at'
        )
        read_only_fields = ('id', 'performed_by', 'created_at')


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)
    recent_movements = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'sku', 'name', 'description', 'category', 'category_id',
            'price', 'cost_price', 'quantity_in_stock', 'reorder_level',
            'is_active', 'is_low_stock', 'recent_movements', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'is_low_stock', 'created_at', 'updated_at')

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_recent_movements(self, obj):
        movements = obj.stock_movements.all()[:5]
        return StockMovementSerializer(movements, many=True).data


class StockAdjustmentSerializer(serializers.Serializer):
    quantity_change = serializers.IntegerField(
        help_text="Positive number to add stock, negative number to remove stock."
    )
    movement_type = serializers.ChoiceField(
        choices=StockMovementType.choices,
        default=StockMovementType.ADJUSTMENT
    )
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
