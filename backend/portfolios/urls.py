from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from . import admin_views

# Router pour les ViewSets d'administration
admin_router = DefaultRouter()
admin_router.register(r'categories', admin_views.AssetCategoryViewSet, basename='category')
admin_router.register(r'users', admin_views.UserManagementViewSet, basename='user')

urlpatterns = [
    # Routes d'authentification
    path('auth/login/', auth_views.login_view, name='login'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/me/', auth_views.current_user, name='current_user'),
    path('auth/check/', auth_views.check_auth, name='check_auth'),
    
    # Routes d'administration (réservées aux superusers)
    path('admin/check-superuser/', admin_views.check_superuser, name='check_superuser'),
    path('admin/', include(admin_router.urls)),
    
    # Routes existantes
    path('health/', views.health_check, name='health_check'),
    path('import/signaletique/', views.import_signaletique, name='import_signaletique'),
    path('signaletique/', views.list_signaletique, name='list_signaletique'),
    path('signaletique/export/', views.export_signaletique_csv, name='export_signaletique_csv'),
    path('signaletique/clear/', views.clear_signaletique, name='clear_signaletique'),
    path('signaletique/<int:pk>/', views.signaletique_detail, name='signaletique_detail'),
    path('import/logs/', views.import_logs, name='import_logs'),
    path('target-portfolios/', views.list_target_portfolios, name='list_target_portfolios'),
    path('target-portfolios/<int:pk>/', views.target_portfolio_detail, name='target_portfolio_detail'),
    path('real-portfolios/', views.list_real_portfolios, name='list_real_portfolios'),
    path('real-portfolios/<int:pk>/', views.real_portfolio_detail, name='real_portfolio_detail'),
    path('real-portfolios/<int:pk>/fifo-analysis/', views.portfolio_fifo_analysis, name='portfolio_fifo_analysis'),
    path('import/transactions/', views.import_transactions, name='import_transactions'),
    path('transactions/', views.list_transactions, name='list_transactions'),
    path('transactions/<int:pk>/', views.delete_transaction, name='delete_transaction'),
]
