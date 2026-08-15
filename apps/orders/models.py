import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.inventory.models import Product
from .querysets import OrderManager


class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending Payment / Processing')
    PROCESSING = 'PROCESSING', _('In Fulfillment')
    COMPLETED = 'COMPLETED', _('Completed / Delivered')
    CANCELLED = 'CANCELLED', _('Cancelled')


class Order(models.Model):
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
        db_index=True
    )
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    shipping_address = models.TextField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = OrderManager()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Order #{self.order_number} - {self.client.email} ({self.status})"

    @staticmethod
    def generate_order_number():
        return f"ORD-{uuid.uuid4().hex[:8].upper()}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=['order', 'product']),
        ]

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} @ {self.unit_price}"
