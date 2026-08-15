from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import User
from .permissions import IsAdminRole, IsManagerRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
)


@extend_schema(tags=['Authentication'])
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Obtain JWT Access and Refresh token pair with extended user info payload.
    """
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(tags=['Authentication'])
class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user (Default role: CLIENT).
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


@extend_schema(tags=['Authentication'])
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update authenticated user profile details.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(tags=['Authentication'])
class UserListView(generics.ListAPIView):
    """
    List all users (Restricted to Store Managers and Admins).
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsManagerRole]
    filterset_fields = ['role']
    search_fields = ['email', 'first_name', 'last_name', 'company_name']
