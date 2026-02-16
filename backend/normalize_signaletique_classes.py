import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import Signaletique

print("=== Normalisation des classes d'actifs dans donnees_supplementaires ===\n")

signaletiques = Signaletique.objects.all()
updated = 0

for sig in signaletiques:
    if sig.donnees_supplementaires and isinstance(sig.donnees_supplementaires, dict):
        # Chercher la clé "Classe d'actifs"
        classe_key = None
        for key in sig.donnees_supplementaires.keys():
            if "classe" in key.lower() and "actif" in key.lower():
                classe_key = key
                break
        
        if classe_key and sig.donnees_supplementaires[classe_key]:
            old_value = sig.donnees_supplementaires[classe_key]
            new_value = old_value.strip().capitalize() if isinstance(old_value, str) else old_value
            
            if old_value != new_value:
                sig.donnees_supplementaires[classe_key] = new_value
                sig.save()
                print(f"  {sig.titre}: '{old_value}' -> '{new_value}'")
                updated += 1

print(f"\n{updated} signalétique(s) mise(s) à jour")
