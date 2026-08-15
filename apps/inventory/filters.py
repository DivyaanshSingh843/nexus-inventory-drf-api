import django_filters
from django.db.models import F
from .models import Product, Category, StockMovement


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    category_slug = django_filters.CharFilter(field_name="category__slug", lookup_expr='exact')
    category_id = django_filters.NumberFilter(field_name="category__id", lookup_expr='exact')
    stock_status = django_filters.CharFilter(method='filter_stock_status')

    class Meta:
        model = Product
        fields = ['category_slug', 'category_id', 'is_active', 'min_price', 'max_price']

    def filter_stock_status(self, queryset, name, value):
        if value == 'low_stock':
            return queryset.filter(quantity_in_stock__lte=F('reorder_level'), quantity_in_stock__gt=0)
        elif value == 'out_of_stock':
            return queryset.filter(quantity_in_stock__lte=0)
        elif value == 'in_stock':
            return queryset.filter(quantity_in_stock__gt=0)
        return queryset
