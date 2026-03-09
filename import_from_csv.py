#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique, AssetCategory
import openpyxl
import csv

# Lire le fichier CSV export
with open('signaletique_export.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    csv_data = list(reader)

print(f"📄 Fichier CSV chargé: {len(csv_data)} lignes")

count = 0
updated = 0
created = 0
errors = []

for idx, row in enumerate(csv_data, 1):
    try:
        # Utiliser la colonne "Isin" (avec I majuscule) qui contient les bonnes valeurs
        isin = row.get('Isin', '').strip()
        if not isin or len(isin) != 12:
            errors.append(f"Ligne {idx}: ISIN invalide ou vide: '{isin}'")
            continue
        
        titre = row.get('Titre', '').strip()
        type_instr = row.get('Type d\'instr', '').strip()
        classe = row.get('Classe d\'actifs', '').strip()
        
        if not titre:
            errors.append(f"Ligne {idx} (ISIN {isin}): Titre vide")
            continue
        
        # Préparer les données supplémentaires
        donnees_supp = {}
        for key, value in row.items():
            if value and str(value).strip():
                donnees_supp[key] = value
        
        # Gérer la catégorie
        categorie_instance = None
        if classe:
            categorie_instance, _ = AssetCategory.objects.get_or_create(
                name=classe.capitalize()
            )
        
        # Mettre à jour ou créer
        sig, is_created = Signaletique.objects.update_or_create(
            isin=isin,
            defaults={
                'code': f'SIG_{isin}',
                'titre': titre[:500],
                'categorie': categorie_instance,
                'categorie_text': classe if classe else None,
                'statut': type_instr if type_instr else None,
                'donnees_supplementaires': donnees_supp
            }
        )
        
        count += 1
        if is_created:
            created += 1
            print(f"➕ Créé: {isin} - {titre[:50]}")
        else:
            updated += 1
            print(f"🔄 Mis à jour: {isin} - {titre[:50]}")
    
    except Exception as e:
        errors.append(f"Ligne {idx}: Erreur - {str(e)}")

print(f"\n✅ Import terminé !")
print(f"📊 Total traité : {count}")
print(f"➕ Créées : {created}")
print(f"🔄 Mises à jour : {updated}")

if errors:
    print(f"\n⚠️  Erreurs ({len(errors)}):")
    for err in errors[:10]:  # Afficher max 10 erreurs
        print(f"  {err}")
