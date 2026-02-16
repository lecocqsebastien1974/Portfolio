import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import AssetCategory

print("=== Normalisation des noms de catégories ===\n")

categories = AssetCategory.objects.all()
updated = 0

for cat in categories:
    original_name = cat.name
    # Force la normalisation en appelant save()
    cat.save()
    if cat.name != original_name:
        print(f"  '{original_name}' -> '{cat.name}'")
        updated += 1
    else:
        print(f"  '{cat.name}' (déjà normalisé)")

print(f"\n{updated} catégorie(s) mise(s) à jour")
print(f"\n=== Catégories finales ===")
for cat in AssetCategory.objects.all().order_by('ordre', 'name'):
    print(f"  {cat.id:2d} | {cat.name}")
