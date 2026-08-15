from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),

    # OpenAPI 3.0 Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Modular Domain APIs (v1)
    path('api/v1/auth/', include('apps.authentication.urls', namespace='authentication')),
    path('api/v1/inventory/', include('apps.inventory.urls', namespace='inventory')),
    path('api/v1/orders/', include('apps.orders.urls', namespace='orders')),
    path('api/v1/analytics/', include('apps.analytics.urls', namespace='analytics')),
]
