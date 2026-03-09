#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Transaction
import openpyxl
from openpyxl import Workbook

# Colonnes du format d'import
columns = ['Date', 'Sens ', 'Isin', 'quantité', 'prix', 'Devise', 'Portefeuille']

# Créer le workbook Excel
wb = Workbook()
ws = wb.active
ws.title = "Transactions"

# Écrire les en-têtes
ws.append(columns)

# Récupérer toutes les transactions
transactions = Transaction.objects.select_related(
    'signaletique', 
    'portfolio'
).all().order_by('date', 'id')

print(f"Export de {transactions.count()} transactions...")
print("="*80)

count = 0
for trans in transactions:
    count += 1
    
    # Préparer la ligne
    row = [
        trans.date,  # Date
        trans.type_operation,  # Sens (ACHAT/VENTE)
        trans.signaletique.isin if trans.signaletique else '',  # ISIN
        float(trans.quantite),  # quantité
        float(trans.prix_unitaire),  # prix
        trans.devise,  # Devise
        trans.portfolio.name if trans.portfolio else ''  # Portefeuille
    ]
    
    ws.append(row)
    
    if count % 10 == 0:
        print(f"  Exporté: {count}/{transactions.count()}")

# Sauvegarder le fichier Excel
output_file = 'achatall.xlsx'
wb.save(output_file)

print(f"\n{'='*80}")
print(f"✅ Export terminé !")
print(f"📊 {count} transactions exportées")
print(f"📁 Fichier: {output_file}")
print('='*80)
