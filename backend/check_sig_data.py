from portfolios.models import Signaletique

sig = Signaletique.objects.first()
if sig and sig.donnees_supplementaires:
    print("Premier titre:", sig.titre)
    for key in sig.donnees_supplementaires.keys():
        if "classe" in key.lower():
            print(f"  Clé trouvée: '{key}'")
            print(f"  Valeur: '{sig.donnees_supplementaires[key]}'")
else:
    print("Aucune signalétique trouvée")
