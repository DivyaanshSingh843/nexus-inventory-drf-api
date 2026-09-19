from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from .querysets import ProductManager


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['name']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products'
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_in_stock = models.IntegerField(default=0, db_index=True)
    reorder_level = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProductManager()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active', 'category']),
            models.Index(fields=['quantity_in_stock']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"[{self.sku}] {self.name}"

    @property
    def is_low_stock(self):
        return self.quantity_in_stock <= self.reorder_level


class StockMovementType(models.TextChoices):
    INBOUND = 'INBOUND', _('Inbound (Restock)')
    OUTBOUND = 'OUTBOUND', _('Outbound (Order fulfillment)')
    ADJUSTMENT = 'ADJUSTMENT', _('Manual Audit Adjustment')


class StockMovement(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='stock_movements'
    )
    movement_type = models.CharField(
        max_length=20,
        choices=StockMovementType.choices
    )
    quantity = models.IntegerField(
        help_text=_('Positive number for addition, negative for deduction')
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text=_('Order ID, PO number, or Audit Tag')
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_movements'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['movement_type']),
        ]

    def __str__(self):
        return f"{self.movement_type} - {self.product.sku}: {self.quantity}"
