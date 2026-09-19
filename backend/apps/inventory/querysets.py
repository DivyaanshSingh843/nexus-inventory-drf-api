from django.db import models
from django.db.models import F, Q, ExpressionWrapper, DecimalField


class ProductQuerySet(models.QuerySet):
    """
    Optimized custom QuerySet for Product model to eliminate N+1 queries
    and provide database-level filtering methods.
    """
    def active(self):
        return self.filter(is_active=True)

    def with_category(self):
        """
        Eliminates N+1 query overhead for Product -> Category relation.
        """
        return self.select_related('category')

    def with_movements(self):
        """
        Prefetches recent stock movements for batch queries.
        """
        return self.prefetch_related('stock_movements')

    def low_stock(self):
        """
        DB-level filter for items running low on stock.
        """
        return self.filter(quantity_in_stock__lte=F('reorder_level'))

    def out_of_stock(self):
        return self.filter(quantity_in_stock__lte=0)

    def optimized_list(self):
        """
        Standard list query optimization combining category selection.
        """
        return self.with_category().filter(is_active=True)


class ProductManager(models.Manager):
    def get_queryset(self):
        return ProductQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def with_category(self):
        return self.get_queryset().with_category()

    def optimized_list(self):
        return self.get_queryset().optimized_list()

    def low_stock(self):
        return self.get_queryset().low_stock()
