from portfolios.models import Signaletique
import json

s = Signaletique.objects.filter(titre__icontains='IShares Digital').first()
if s:
    print('Titre:', s.titre)
    print('categorie FK:', s.categorie)
    print('categorie_text:', s.categorie_text)
    print('donnees_supplementaires:', json.dumps(s.donnees_supplementaires, indent=2, ensure_ascii=False))
else:
    print('Titre non trouvé')
