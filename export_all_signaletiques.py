#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique
import openpyxl
from openpyxl import Workbook

# Ordre des colonnes du template d'import
import_columns = [
    'Type d\'instr', 'Isin', 'Classe d\'actifs', 'Nom', 'Symbole', 'Banques Dispo', 
    'Devise', 'Taux', 'Date de fin', 'Qualité credit', 'TER', 'Cap/Dis', 'ESG', 
    'Replication', 'Taille du Fonds', 'Positions', 'Couverture de change', 'USA', 
    'Japon', 'Grande Bretagne', 'Canada', 'Pays Emergeants Hors Chine et Japon', 
    'Australie', 'Suède', 'Suisse', 'Chine', 'Israel', 'Allemagne', 'Nouvelle Zelande', 
    'Pays-Bas', 'Irlande', 'Espagne', 'Italie', 'France', 'Autre Pays', 'Etats', 
    'Industrie', 'Finance', 'Consommation Cyclique', 'Technologie', 'Santé', 
    'Consommation Defensive', 'Communication', 'Immobilier', 'Matières Premières', 
    'Energie', 'Service Publiques', 'Services de consommation', 'Autre Secteur', 
    'Etats2', 'Banque Emetteur', 'Entreprises', 'Autre Emetteur', 'CodeBank', 
    'Frequence Coupon'
]

# Mapping des noms de colonnes (variations possibles)
column_mapping = {
    'Type d\'instr': ['Type d\'instr', 'Type d\'instrument', 'Type'],
    'Isin': ['Isin', 'ISIN', 'isin'],
    'Classe d\'actifs': ['Classe d\'actifs', 'Classe d\'actif'],
    'Nom': ['Nom', 'Titre', 'Nom Long'],
    'Symbole': ['Symbole', 'Symbol'],
    'Banques Dispo': ['Banques Dispo'],
    'Devise': ['Devise'],
    'Taux': ['Taux', 'Taux (%)', 'Taux %'],
    'Date de fin': ['Date de fin'],
    'Qualité credit': ['Qualité credit', 'Qualité crédit', 'Qualite credit'],
    'TER': ['TER', 'TER (%)', 'TER %'],
    'Cap/Dis': ['Cap/Dis', 'Cap - Dis'],
    'ESG': ['ESG'],
    'Replication': ['Replication', 'Réplication'],
    'Taille du Fonds': ['Taille du Fonds'],
    'Positions': ['Positions'],
    'Couverture de change': ['Couverture de change']
}

def get_value_from_data(data, target_col):
    """Récupère une valeur depuis donnees_supplementaires en essayant différentes variantes"""
    if not data:
        return ''
    
    # Chercher les variantes possibles
    possible_keys = column_mapping.get(target_col, [target_col])
    for key in possible_keys:
        if key in data:
            value = data[key]
            # Ne pas retourner les formules Excel
            if isinstance(value, str) and value.startswith('='):
                return ''
            return value if value is not None else ''
    
    # Si pas trouvé dans les variantes, chercher directement
    if target_col in data:
        value = data[target_col]
        if isinstance(value, str) and value.startswith('='):
            return ''
        return value if value is not None else ''
    
    return ''

# Créer le workbook Excel
wb = Workbook()
ws = wb.active
ws.title = "Signaletiques"

# Écrire les en-têtes
ws.append(import_columns)

# Récupérer toutes les signalétiques
signaletiques = Signaletique.objects.all().order_by('isin')

print(f"Export de {signaletiques.count()} signalétiques...")
print("="*80)

count = 0
for sig in signaletiques:
    count += 1
    data = sig.donnees_supplementaires or {}
    
    # Construire la ligne selon l'ordre du template
    row = []
    
    for col_name in import_columns:
        if col_name == 'Type d\'instr':
            value = sig.statut or get_value_from_data(data, col_name)
        elif col_name == 'Isin':
            value = sig.isin
        elif col_name == 'Classe d\'actifs':
            value = sig.categorie_text or get_value_from_data(data, col_name)
        elif col_name == 'Nom':
            value = sig.titre or get_value_from_data(data, col_name)
        else:
            value = get_value_from_data(data, col_name)
        
        row.append(value if value else '')
    
    ws.append(row)
    
    if count % 10 == 0:
        print(f"  Exporté: {count}/{signaletiques.count()}")

# Sauvegarder le fichier Excel
output_file = 'signaletiqueall.xlsx'
wb.save(output_file)

print(f"\n{'='*80}")
print(f"✅ Export terminé !")
print(f"📊 {count} signalétiques exportées")
print(f"📁 Fichier: {output_file}")
print('='*80)
