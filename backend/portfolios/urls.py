from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from . import admin_views

# Router pour les ViewSets d'administration
admin_router = DefaultRouter()
admin_router.register(r'categories', admin_views.AssetCategoryViewSet, basename='category')
admin_router.register(r'instrument-types', admin_views.InstrumentTypeViewSet, basename='instrument-type')
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
    path('categories/', views.list_categories, name='list_categories'),
    path('instrument-types/', views.list_instrument_types, name='list_instrument_types'),
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
    path('cash/', views.list_cash, name='list_cash'),
    path('cash/<int:pk>/', views.cash_detail, name='cash_detail'),
    path('import/transactions/', views.import_transactions, name='import_transactions'),
    path('import/cash/', views.import_cash, name='import_cash'),
    path('import/target-portfolio/', views.import_target_portfolio, name='import_target_portfolio'),
    path('import/users/', auth_views.import_users, name='import_users'),
    path('import/koala/', views.import_koala, name='import_koala'),
    path('import/koala/history/', views.get_koala_history, name='get_koala_history'),
    path('import/bonobo/', views.import_bonobo, name='import_bonobo'),
    path('import/bonobo/history/', views.get_bonobo_history, name='get_bonobo_history'),
    path('import/prix-startfiles/', views.import_prix_startfiles, name='import_prix_startfiles'),
    path('prix-historique/consolidate/', views.consolidate_prices, name='consolidate_prices'),
    path('prix-historique/', views.list_prix_historique, name='list_prix_historique'),
    path('prix-historique/<str:isin>/', views.titre_price_history, name='titre_price_history'),
    path('prix-historique/<str:isin>/entries/', views.add_prix_entry, name='add_prix_entry'),
    path('prix-historique/<str:isin>/entries/<str:entry_id>/', views.update_prix_entry, name='update_prix_entry'),
    path('prix-historique/<str:isin>/delete-entry/<str:entry_id>/', views.delete_prix_entry, name='delete_prix_entry'),
    path('prix-historique/<str:isin>/import/', views.import_prix_titre, name='import_prix_titre'),
    path('transactions/', views.list_transactions, name='list_transactions'),
    path('transactions/<int:pk>/', views.delete_transaction, name='delete_transaction'),
    path('backup/', views.backup_all_data, name='backup_all_data'),
    path('restore/', views.restore_all_data, name='restore_all_data'),
    path('clear/', views.clear_all_data, name='clear_all_data'),
]
