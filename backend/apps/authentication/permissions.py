from rest_framework import permissions
from .models import UserRole


class IsAdminRole(permissions.BasePermission):
    """
    Allows access only to Admin users or superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_admin_role
        )


class IsManagerRole(permissions.BasePermission):
    """
    Allows access to Store Managers and Admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_manager_role
        )


class IsManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow Managers and Admins to edit/create objects,
    while allowing read-only access to other authenticated users.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_manager_role


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access to Clients, full access to Staff, Managers, and Admins.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff_role


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to allow owners of an object or Admins/Managers to access/edit it.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_manager_role:
            return True
        # Check if object has user or client relation
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'client'):
            return obj.client == request.user
        return False
