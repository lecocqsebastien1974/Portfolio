from rest_framework import serializers
from django.contrib.auth.models import User
from .models import AssetCategory


class AssetCategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories d'actifs"""
    signaletiques_count = serializers.SerializerMethodField()

    class Meta:
        model = AssetCategory
        fields = ['id', 'name', 'description', 'color', 'ordre', 'signaletiques_count', 'date_creation', 'date_modification']
        read_only_fields = ['date_creation', 'date_modification']

    def validate_name(self, value):
        """Normaliser le nom en capitalisant la première lettre et vérifier les doublons de casse"""
        if value:
            normalized_name = value.strip().capitalize()
            
            # Vérifier si une catégorie avec ce nom (insensible à la casse) existe déjà
            existing = AssetCategory.objects.filter(name__iexact=normalized_name)
            
            # Exclure l'instance actuelle si on est en mode édition
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError(
                    f"Une catégorie avec le nom '{normalized_name}' existe déjà"
                )
            
            return normalized_name
        return value

    def get_signaletiques_count(self, obj):
        """Retourne le nombre de signalétiques dans cette catégorie"""
        return obj.signaletiques.count()


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'date_joined', 'last_login', 'password']
        read_only_fields = ['date_joined', 'last_login']

    def create(self, validated_data):
        """Créer un nouvel utilisateur avec un mot de passe hashé"""
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Mot de passe par défaut si non fourni
            user.set_password('changeme123')
        user.save()
        return user

    def update(self, instance, validated_data):
        """Mettre à jour un utilisateur"""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance
