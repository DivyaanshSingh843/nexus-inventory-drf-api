from django.db import models


class OrderQuerySet(models.QuerySet):
    """
    Optimized custom QuerySet for Order model ensuring no N+1 queries when fetching
    orders along with client profile and line items with product details.
    """
    def with_details(self):
        return self.select_related('client').prefetch_related('items__product', 'items__product__category')

    def for_client(self, client_user):
        return self.filter(client=client_user)

    def completed(self):
        return self.filter(status='COMPLETED')

    def pending(self):
        return self.filter(status='PENDING')


class OrderManager(models.Manager):
    def get_queryset(self):
        return OrderQuerySet(self.model, using=self._db)

    def with_details(self):
        return self.get_queryset().with_details()

    def for_client(self, client_user):
        return self.get_queryset().for_client(client_user)
