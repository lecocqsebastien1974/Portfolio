"""Script pour créer l'utilisateur seblec"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from django.contrib.auth.models import User

username = 'seblec'
email = 'seblec@example.com'  # À modifier si nécessaire
password = 'Temp2026!'  # Mot de passe temporaire à changer

try:
    user = User.objects.get(username=username)
    print(f"L'utilisateur {username} existe déjà.")
    print(f"  - Actif: {user.is_active}")
    print(f"  - Staff: {user.is_staff}")
    print(f"  - Superuser: {user.is_superuser}")
    
    # Réactiver et réinitialiser le mot de passe au cas où
    user.is_active = True
    user.set_password(password)
    user.save()
    print(f"\n✓ Mot de passe réinitialisé à: {password}")
    
except User.DoesNotExist:
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_staff=True,  # Accès à l'admin
        is_superuser=True  # Tous les droits
    )
    print(f"✓ Utilisateur '{username}' créé avec succès!")
    print(f"  - Username: {username}")
    print(f"  - Email: {email}")
    print(f"  - Mot de passe: {password}")
    print(f"  - Staff: {user.is_staff}")
    print(f"  - Superuser: {user.is_superuser}")
    print(f"\n⚠️  N'oubliez pas de changer le mot de passe après la première connexion!")
