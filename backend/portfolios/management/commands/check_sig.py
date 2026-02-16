from django.core.management.base import BaseCommand
from portfolios.models import Signaletique


class Command(BaseCommand):
    help = 'Vérifie les données de signalétiques'

    def handle(self, *args, **options):
        sig = Signaletique.objects.first()
        if sig and sig.donnees_supplementaires:
            self.stdout.write(f"Premier titre: {sig.titre}")
            for key in sig.donnees_supplementaires.keys():
                if "classe" in key.lower():
                    self.stdout.write(f"  Clé trouvée: '{key}'")
                    self.stdout.write(f"  Valeur: '{sig.donnees_supplementaires[key]}'")
        else:
            self.stdout.write("Aucune signalétique trouvée")
