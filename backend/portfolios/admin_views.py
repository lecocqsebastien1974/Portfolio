from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import AssetCategory
from .admin_serializers import AssetCategorySerializer, UserSerializer


class IsSuperUser(permissions.BasePermission):
    """Permission personnalisée pour vérifier que l'utilisateur est un superuser"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class AssetCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les catégories d'actifs"""
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    permission_classes = [IsSuperUser]
    pagination_class = None  # Désactiver la pagination


class UserManagementViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les utilisateurs"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperUser]
    pagination_class = None  # Désactiver la pagination

    def get_queryset(self):
        """Optionnellement filtrer les utilisateurs"""
        queryset = User.objects.all().order_by('-date_joined')
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_superuser(request):
    """Vérifier si l'utilisateur courant est un superuser"""
    return Response({
        'is_superuser': request.user.is_superuser,
        'username': request.user.username
    })
