import csv
import openpyxl
from openpyxl import Workbook

# Lire le fichier export
with open('signaletique_export.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    export_data = list(reader)

# Ordre des colonnes pour le format d'import (selon le template)
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

# Mapping export -> import (certains noms de colonnes sont identiques)
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

# Convertir chaque ligne
for row in export_data:
    new_row = []
    for import_col in import_columns:
        # Trouver la colonne correspondante dans l'export
        export_col = column_mapping.get(import_col)
        if export_col and export_col in row:
            value = row[export_col]
            # Nettoyer les valeurs vides
            if value == '':
                new_row.append('')
            else:
                new_row.append(value)
        else:
            new_row.append('')
    
    ws.append(new_row)

# Sauvegarder le fichier Excel
output_file = 'signaletique etf et actions.xlsx'
wb.save(output_file)

print(f"✅ Fichier créé : {output_file}")
print(f"📊 Nombre de lignes traitées : {len(export_data)}")
