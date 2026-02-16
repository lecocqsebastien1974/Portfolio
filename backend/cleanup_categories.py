import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import AssetCategory, Signaletique

print("=== Nettoyage des doublons de catégories ===\n")

# Chercher les doublons (même nom avec différentes casses)
categories = AssetCategory.objects.all()
names_seen = {}

for cat in categories:
    name_lower = cat.name.lower()
    if name_lower in names_seen:
        print(f"Doublon trouvé: '{names_seen[name_lower].name}' (ID: {names_seen[name_lower].id}) et '{cat.name}' (ID: {cat.id})")
        
        # Garder celle avec la majuscule (capitalized)
        if cat.name[0].isupper():
            to_keep = cat
            to_delete = names_seen[name_lower]
        else:
            to_keep = names_seen[name_lower]
            to_delete = cat
        
        print(f"  -> Conservation: '{to_keep.name}' (ID: {to_keep.id})")
        print(f"  -> Suppression: '{to_delete.name}' (ID: {to_delete.id})")
        
        # Mettre à jour les signalétiques qui pointent vers la catégorie à supprimer
        sigs_to_update = Signaletique.objects.filter(categorie=to_delete)
        count = sigs_to_update.count()
        if count > 0:
            print(f"  -> Mise à jour de {count} signalétique(s)")
            sigs_to_update.update(categorie=to_keep)
        
        # Supprimer la catégorie en doublon
        to_delete.delete()
        print(f"  -> Catégorie '{to_delete.name}' supprimée\n")
    else:
        names_seen[name_lower] = cat

print("\n=== Catégories finales ===")
for cat in AssetCategory.objects.all().order_by('ordre', 'name'):
    count = cat.signaletiques.count()
    print(f"  {cat.id:2d} | {cat.name:20s} | ordre={cat.ordre:2d} | {count} titre(s)")
