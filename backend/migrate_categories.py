#!/usr/bin/env python
"""
Script pour mettre à jour les catégories manquantes depuis donnees_supplementaires
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique, AssetCategory

# Mapping des noms dans donnees_supplementaires vers les noms dans AssetCategory
CATEGORY_MAPPING = {
    'Actions': 'Actions',
    'Real estate': 'Immobilier',
    'Obligations': 'Obligations',
    'Monétaire': 'Monétaire',
    'Alternatif': 'Alternatif',
    'Mixte': 'Mixte',
    'Matières premières': 'Matières premières',
    'Long/short': 'Long/short',
}

def migrate_categories(dry_run=True):
    """
    Migrate categories from donnees_supplementaires to categorie FK
    
    Args:
        dry_run: If True, only show what would be done without making changes
    """
    # Titres sans catégorie assignée
    orphelins = Signaletique.objects.filter(
        categorie__isnull=True, 
        categorie_text__isnull=True
    )
    
    total = orphelins.count()
    print(f"Titres sans catégorie: {total}\n")
    
    updated = 0
    errors = 0
    skipped = 0
    
    for sig in orphelins:
        if not sig.donnees_supplementaires or "Classe d'actifs" not in sig.donnees_supplementaires:
            skipped += 1
            continue
            
        cat_value = sig.donnees_supplementaires["Classe d'actifs"]
        if not cat_value or not cat_value.strip():
            skipped += 1
            continue
        
        # Mapper vers le nom AssetCategory
        mapped_name = CATEGORY_MAPPING.get(cat_value)
        if not mapped_name:
            print(f"⚠️  Mapping non trouvé pour '{cat_value}' ({sig.titre})")
            errors += 1
            continue
        
        # Trouver l'AssetCategory
        try:
            asset_category = AssetCategory.objects.get(name=mapped_name)
        except AssetCategory.DoesNotExist:
            print(f"❌ AssetCategory '{mapped_name}' n'existe pas ({sig.titre})")
            errors += 1
            continue
        
        # Mettre à jour
        if dry_run:
            print(f"[DRY RUN] {sig.titre[:50]:50s} → {asset_category.name}")
        else:
            sig.categorie = asset_category
            sig.save()
            print(f"✓ {sig.titre[:50]:50s} → {asset_category.name}")
        
        updated += 1
    
    print(f"\n{'='*70}")
    print(f"Résumé:")
    print(f"  - Total: {total}")
    print(f"  - {'Seront mis à jour' if dry_run else 'Mis à jour'}: {updated}")
    print(f"  - Ignorés (pas de données): {skipped}")
    print(f"  - Erreurs: {errors}")
    print(f"{'='*70}")
    
    return updated, errors, skipped

if __name__ == '__main__':
    # Vérifier les arguments
    dry_run = '--execute' not in sys.argv
    
    if dry_run:
        print("MODE DRY RUN - Aucune modification ne sera effectuée")
        print("Pour exécuter réellement, ajoutez --execute\n")
    else:
        print("MODE EXECUTION - Les modifications seront sauvegardées\n")
    
    migrate_categories(dry_run=dry_run)
