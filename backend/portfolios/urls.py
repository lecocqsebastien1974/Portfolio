from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('import/signaletique/', views.import_signaletique, name='import_signaletique'),
    path('signaletique/', views.list_signaletique, name='list_signaletique'),
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
