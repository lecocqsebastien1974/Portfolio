import csv
import openpyxl
from openpyxl import Workbook

# Lire le fichier export
with open('signaletique_export.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    export_data = list(reader)

# Ordre des colonnes pour le format d'import
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

# Mapping export -> import
column_mapping = {
    'Type d\'instr': 'Type d\'instr',
    'Isin': 'ISIN',
    'Classe d\'actifs': 'Classe d\'actifs',
    'Nom': 'Titre',
    'Symbole': 'Symbole',
    'Banques Dispo': 'Banques Dispo',
    'Devise': 'Devise',
    'Taux': 'Taux',
    'Date de fin': 'Date de fin',
    'Qualité credit': 'Qualité credit',
    'TER': 'TER',
    'Cap/Dis': 'Cap/Dis',
    'ESG': 'ESG',
    'Replication': 'Replication',
    'Taille du Fonds': 'Taille du Fonds',
    'Positions': 'Positions',
    'Couverture de change': 'Couverture de change',
    'USA': 'USA',
    'Japon': 'Japon',
    'Grande Bretagne': 'Grande Bretagne',
    'Canada': 'Canada',
    'Pays Emergeants Hors Chine et Japon': 'Pays Emergeants Hors Chine et Japon',
    'Australie': 'Australie',
    'Suède': 'Suède',
    'Suisse': 'Suisse',
    'Chine': 'Chine',
    'Israel': 'Israel',
    'Allemagne': 'Allemagne',
    'Nouvelle Zelande': 'Nouvelle Zelande',
    'Pays-Bas': 'Pays-Bas',
    'Irlande': 'Irlande',
    'Espagne': 'Espagne',
    'Italie': 'Italie',
    'France': 'France',
    'Autre Pays': 'Autre Pays',
    'Etats': 'Etats',
    'Industrie': 'Industrie',
    'Finance': 'Finance',
    'Consommation Cyclique': 'Consommation Cyclique',
    'Technologie': 'Technologie',
    'Santé': 'Santé',
    'Consommation Defensive': 'Consommation Defensive',
    'Communication': 'Communication',
    'Immobilier': 'Immobilier',
    'Matières Premières': 'Matières Premières',
    'Energie': 'Energie',
    'Service Publiques': 'Service Publiques',
    'Services de consommation': 'Services de consommation',
    'Autre Secteur': 'Autre Secteur',
    'Etats2': 'Etats2',
    'Banque Emetteur': 'Banque Emetteur',
    'Entreprises': 'Entreprises',
    'Autre Emetteur': 'Autre Emetteur',
    'CodeBank': 'CodeBank',
    'Frequence Coupon': 'Frequence Coupon'
}

# Créer le workbook Excel
wb = Workbook()
ws = wb.active
ws.title = "Signaletique"

# Écrire les en-têtes
ws.append(import_columns)

# Compteurs
lignes_ok = 0
lignes_ignorees = 0
isins_ignores = []

# Convertir chaque ligne
for row in export_data:
    isin_value = row.get('ISIN', '').strip()
    
    # Garder UNIQUEMENT les ISINs avec exactement 12 caractères
    if not isin_value or len(isin_value) != 12:
        if isin_value:
            isins_ignores.append(f"{isin_value} (longueur: {len(isin_value)})")
            lignes_ignorees += 1
        continue
    
    new_row = []
    for import_col in import_columns:
        export_col = column_mapping.get(import_col)
        if export_col and export_col in row:
            value = row[export_col]
            if value == '':
                new_row.append('')
            else:
                new_row.append(value)
        else:
            new_row.append('')
    
    ws.append(new_row)
    lignes_ok += 1

# Sauvegarder le fichier Excel
output_file = 'signaletique_valides.xlsx'
wb.save(output_file)

print(f"✅ Fichier créé : {output_file}")
print(f"📊 Lignes valides (ISIN 12 caractères) : {lignes_ok}")
print(f"⚠️  Lignes ignorées : {lignes_ignorees}")
if isins_ignores:
    print(f"\nISINs ignorés :")
    for isin in isins_ignores:
        print(f"  - {isin}")
