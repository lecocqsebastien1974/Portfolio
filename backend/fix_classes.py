from portfolios.models import Signaletique

updated = 0
sigs = Signaletique.objects.all()
total = sigs.count()

for sig in sigs:
    if sig.donnees_supplementaires and isinstance(sig.donnees_supplementaires, dict):
        changed = False
        for key in list(sig.donnees_supplementaires.keys()):
            if "classe" in key.lower() and "actif" in key.lower():
                old_val = sig.donnees_supplementaires[key]
                if old_val and isinstance(old_val, str):
                    new_val = old_val.strip().capitalize()
                    if old_val != new_val:
                        sig.donnees_supplementaires[key] = new_val
                        changed = True
        
        if changed:
            sig.save()
            updated += 1

print(f"Traité: {total}, Modifié: {updated}")
