"""
URL configuration for portfolio_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def api_root(request):
    """Page d'accueil de l'API"""
    return JsonResponse({
        'message': 'Portfolio Management API',
        'version': '1.0.0',
        'frontend_url': 'http://localhost:3001',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'auth': {
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'check': '/api/auth/check/',
                'me': '/api/auth/me/'
            },
            'signaletique': '/api/signaletique/',
            'admin_panel': {
                'categories': '/api/admin/categories/',
                'users': '/api/admin/users/'
            }
        }
    })


urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/', include('portfolios.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
