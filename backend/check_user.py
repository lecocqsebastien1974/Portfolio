"""Script pour vérifier l'état de l'utilisateur seblec"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from django.contrib.auth.models import User

username = 'seblec'

try:
    user = User.objects.get(username=username)
    print(f"✓ Utilisateur trouvé: {user.username}")
    print(f"  - Email: {user.email}")
    print(f"  - Actif: {user.is_active}")
    print(f"  - Staff: {user.is_staff}")
    print(f"  - Superuser: {user.is_superuser}")
    print(f"  - Dernière connexion: {user.last_login}")
    print(f"  - Date de création: {user.date_joined}")
    
    if not user.is_active:
        print("\n⚠️  PROBLÈME: L'utilisateur est désactivé!")
        reponse = input("Voulez-vous activer cet utilisateur? (o/n): ")
        if reponse.lower() == 'o':
            user.is_active = True
            user.save()
            print("✓ Utilisateur activé avec succès!")
    
    if not user.has_usable_password():
        print("\n⚠️  PROBLÈME: L'utilisateur n'a pas de mot de passe utilisable!")
        reponse = input("Voulez-vous réinitialiser le mot de passe? (o/n): ")
        if reponse.lower() == 'o':
            nouveau_mdp = input("Nouveau mot de passe: ")
            user.set_password(nouveau_mdp)
            user.save()
            print("✓ Mot de passe réinitialisé avec succès!")
            
except User.DoesNotExist:
    print(f"✗ Utilisateur '{username}' non trouvé dans la base de données")
    print("\nListe des utilisateurs existants:")
    for u in User.objects.all():
        print(f"  - {u.username} (actif: {u.is_active}, staff: {u.is_staff})")
    
    reponse = input(f"\nVoulez-vous créer l'utilisateur '{username}'? (o/n): ")
    if reponse.lower() == 'o':
        email = input("Email: ")
        mdp = input("Mot de passe: ")
        is_staff = input("Staff (o/n): ").lower() == 'o'
        is_superuser = input("Superuser (o/n): ").lower() == 'o'
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=mdp,
            is_staff=is_staff,
            is_superuser=is_superuser
        )
        print(f"✓ Utilisateur '{username}' créé avec succès!")
