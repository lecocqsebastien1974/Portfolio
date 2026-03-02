#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique, AssetCategory

# 1. Combien de titres ont NULL pour categorie et categorie_text ?
orphelins = Signaletique.objects.filter(categorie__isnull=True, categorie_text__isnull=True)
print(f"Titres sans catégorie assignée: {orphelins.count()}")

# 2. Parmi eux, combien ont une catégorie dans donnees_supplementaires ?
avec_data = 0
sans_data = 0
categories_trouvees = set()

for sig in orphelins:
    if sig.donnees_supplementaires and "Classe d'actifs" in sig.donnees_supplementaires:
        cat_value = sig.donnees_supplementaires["Classe d'actifs"]
        if cat_value and cat_value.strip():
            avec_data += 1
            categories_trouvees.add(cat_value)
        else:
            sans_data += 1
    else:
        sans_data += 1

print(f"\nParmi eux:")
print(f"  - Avec 'Classe d'actifs' dans donnees_supplementaires: {avec_data}")
print(f"  - Sans 'Classe d'actifs': {sans_data}")

if categories_trouvees:
    print(f"\nCatégories trouvées dans donnees_supplementaires:")
    for cat in sorted(categories_trouvees):
        print(f"  - {cat}")

# 3. Lister les AssetCategory existantes
print(f"\nAssetCategory existantes dans la base:")
for ac in AssetCategory.objects.all().order_by('ordre', 'name'):
    print(f"  - {ac.name}")
