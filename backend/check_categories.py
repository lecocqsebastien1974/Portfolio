import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import AssetCategory

print("Catégories d'actifs:")
for cat in AssetCategory.objects.all().order_by('name'):
    print(f"ID: {cat.id}, Nom: '{cat.name}', Ordre: {cat.ordre}")
