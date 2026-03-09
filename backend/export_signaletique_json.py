"""Export signaletique from DB to signaletique.json, preserving PostgreSQL IDs."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique
from portfolios import file_storage
import json

records = []
for s in Signaletique.objects.all().order_by('id'):
    records.append({
        'id': s.id,
        'code': s.code,
        'isin': s.isin if s.isin else None,
        'titre': s.titre,
        'description': s.description if s.description else None,
        'categorie_text': s.categorie.name if s.categorie else (s.categorie_text if s.categorie_text else None),
        'statut': s.statut if s.statut else None,
        'donnees_supplementaires': s.donnees_supplementaires if s.donnees_supplementaires else {},
        'date_creation': s.date_creation.isoformat() if s.date_creation else None,
        'date_modification': s.date_modification.isoformat() if s.date_modification else None,
    })

sig_path = os.path.join(file_storage.DATA_DIR, 'signaletique.json')
with open(sig_path, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f'Exported {len(records)} signaletiques to {sig_path}')
if records:
    print(f'ID range: {records[0]["id"]} to {records[-1]["id"]}')
    print(f'Sample: {records[0]["isin"]} - {records[0]["titre"]}')
