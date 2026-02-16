from django.core.management.base import BaseCommand
from portfolios.models import Signaletique


class Command(BaseCommand):
    help = 'Normalise les classes d\'actifs dans donnees_supplementaires'

    def handle(self, *args, **options):
        updated = 0
        sigs = Signaletique.objects.all()
        total = sigs.count()

        self.stdout.write(f'Traitement de {total} signalétiques...')

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
                                self.stdout.write(f'  {sig.titre}: "{old_val}" -> "{new_val}"')
                
                if changed:
                    sig.save()
                    updated += 1

        self.stdout.write(self.style.SUCCESS(f'Terminé: {updated} signalétique(s) modifiée(s) sur {total}'))
