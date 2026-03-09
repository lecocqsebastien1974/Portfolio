#!/usr/bin/env python
import csv

# Lire le fichier export
with open('signaletique_export.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

# Trouver toutes les colonnes ISIN
isin_cols = [c for c in data[0].keys() if 'isin' in c.lower()]
print(f"Colonnes contenant 'isin': {isin_cols}\n")

# Analyser les 3 premières lignes
for idx, row in enumerate(data[:3], 1):
    print(f"Ligne {idx}:")
    for col in isin_cols:
        value = row.get(col, '')
        length = len(value) if value else 0
        print(f"  {col}: '{value}' (longueur: {length})")
    print()

# Compter les ISINs valides dans chaque colonne
print("\nStatistiques par colonne:")
for col in isin_cols:
    valid_12 = sum(1 for row in data if row.get(col) and len(row.get(col).strip()) == 12)
    invalid = sum(1 for row in data if row.get(col) and len(row.get(col).strip()) != 12 and row.get(col).strip())
    empty = sum(1 for row in data if not row.get(col) or not row.get(col).strip())
    print(f"  {col}:")
    print(f"    - Valides (12 car): {valid_12}")
    print(f"    - Invalides: {invalid}")
    print(f"    - Vides: {empty}")
