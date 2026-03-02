#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique
import json

s = Signaletique.objects.filter(titre__icontains='IShares Digital').first()
if s:
    print('Titre:', s.titre)
    print('categorie FK:', s.categorie)
    print('categorie_text:', repr(s.categorie_text))
    if s.donnees_supplementaires:
        print('\nClés dans donnees_supplementaires:')
        for key in s.donnees_supplementaires.keys():
            print(f'  - {repr(key)}: {repr(s.donnees_supplementaires[key])[:100]}')
    else:
        print('donnees_supplementaires: None')
else:
    print('Titre non trouvé')
