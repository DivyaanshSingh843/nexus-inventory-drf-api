from rest_framework import serializers
from apps.inventory.models import Product
from .models import Order, OrderItem, OrderStatus


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemDetailSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product_id', 'product_sku', 'product_name', 'quantity', 'unit_price', 'subtotal')


class OrderDetailSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_name = serializers.SerializerMethodField()
    items = OrderItemDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'client', 'client_email', 'client_name',
            'status', 'total_amount', 'shipping_address', 'notes', 'items',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'order_number', 'client', 'total_amount', 'created_at', 'updated_at')

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}".strip() or obj.client.email


class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemInputSerializer(many=True, min_length=1)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("An order must contain at least one item.")
        
        product_ids = [item['product_id'] for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Duplicate product IDs in order items are not allowed.")

        products_map = {p.id: p for p in Product.objects.filter(id__in=product_ids)}
        
        for item in items:
            p_id = item['product_id']
            qty = item['quantity']
            if p_id not in products_map:
                raise serializers.ValidationError(f"Product with ID {p_id} does not exist.")
            
            product = products_map[p_id]
            if not product.is_active:
                raise serializers.ValidationError(f"Product '{product.name}' is currently inactive.")
            
            if product.quantity_in_stock < qty:
                raise serializers.ValidationError(
                    f"Insufficient stock for '{product.name}'. Available: {product.quantity_in_stock}, Requested: {qty}."
                )

        return items


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices)
