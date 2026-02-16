from decimal import Decimal
from rest_framework import serializers
from .models import (
    Signaletique,
    ImportLog,
    TargetPortfolio,
    TargetPortfolioItem,
    RealPortfolio,
    Transaction,
    AssetCategory
)


class SignaletiqueSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False, allow_blank=True)
    categorie_name = serializers.CharField(source='categorie.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Signaletique
        fields = '__all__'
    
    def to_internal_value(self, data):
        """Convertir le nom de catégorie en ID avant la validation"""
        # Créer une copie mutable des données
        if hasattr(data, '_mutable'):
            # C'est un QueryDict de Django
            data._mutable = True
        else:
            # C'est un dict normal, créer une copie
            data = dict(data)
        
        # Si 'categorie' est fourni comme string (nom), le convertir en ID
        if 'categorie' in data and data.get('categorie'):
            categorie_value = data['categorie']
            if isinstance(categorie_value, str):
                try:
                    category = AssetCategory.objects.get(name=categorie_value)
                    data['categorie'] = category.id
                except AssetCategory.DoesNotExist:
                    # Si la catégorie n'existe pas, mettre à None
                    data['categorie'] = None
        
        # Normaliser la classe d'actifs dans donnees_supplementaires
        if 'donnees_supplementaires' in data and isinstance(data.get('donnees_supplementaires'), dict):
            ds = data['donnees_supplementaires']
            # Chercher la clé "Classe d'actifs" (avec différentes variations)
            for key in list(ds.keys()):
                if "classe" in key.lower() and "actif" in key.lower():
                    if ds[key] and isinstance(ds[key], str):
                        # Capitaliser la première lettre pour uniformiser
                        ds[key] = ds[key].strip().capitalize()
        
        return super().to_internal_value(data)
    
    def validate_isin(self, value):
        """Valider que l'ISIN a exactement 12 caractères si fourni et qu'il est unique"""
        if value:
            # Vérifier la longueur
            if len(value) != 12:
                raise serializers.ValidationError(
                    f"L'ISIN doit avoir exactement 12 caractères (actuellement: {len(value)})"
                )
            
            # Vérifier l'unicité lors de la création (pas en modification)
            if not self.instance:  # self.instance est None lors de la création
                if Signaletique.objects.filter(isin=value).exists():
                    raise serializers.ValidationError(
                        f"L'ISIN {value} existe déjà dans la base de données"
                    )
        
        return value
    
    def create(self, validated_data):
        # Générer automatiquement un code si non fourni
        if not validated_data.get('code'):
            isin = validated_data.get('isin')
            if isin:
                # Si ISIN fourni, utiliser SIG_ISIN
                validated_data['code'] = f"SIG_{isin}"
            else:
                # Sinon, générer un code unique basé sur le timestamp
                import time
                timestamp = int(time.time() * 1000)
                validated_data['code'] = f"MAN_{timestamp}"
        
        return super().create(validated_data)


class ImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportLog
        fields = '__all__'


class TargetPortfolioItemSerializer(serializers.ModelSerializer):
    signaletique = serializers.PrimaryKeyRelatedField(queryset=Signaletique.objects.all())

    class Meta:
        model = TargetPortfolioItem
        fields = ['id', 'signaletique', 'ratio']


class TargetPortfolioSerializer(serializers.ModelSerializer):
    items = TargetPortfolioItemSerializer(many=True)

    class Meta:
        model = TargetPortfolio
        fields = ['id', 'name', 'date_creation', 'date_modification', 'items']

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Au moins une ligne est requise")

        total = sum((item['ratio'] for item in items), Decimal('0'))
        if (total - Decimal('100')).copy_abs() > Decimal('0.01'):
            raise serializers.ValidationError("Le total des ratios doit etre egal a 100%")

        ids = [item['signaletique'].id for item in items]
        if len(set(ids)) != len(ids):
            raise serializers.ValidationError("Chaque titre doit etre unique")

        for item in items:
            if item['ratio'] <= 0:
                raise serializers.ValidationError("Chaque ratio doit etre positif")

        return items

    def create(self, validated_data):
        items = validated_data.pop('items')
        portfolio = TargetPortfolio.objects.create(**validated_data)
        TargetPortfolioItem.objects.bulk_create([
            TargetPortfolioItem(
                portfolio=portfolio,
                signaletique=item['signaletique'],
                ratio=item['ratio']
            )
            for item in items
        ])
        return portfolio

    def update(self, instance, validated_data):
        items = validated_data.pop('items', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if items is not None:
            instance.items.all().delete()
            TargetPortfolioItem.objects.bulk_create([
                TargetPortfolioItem(
                    portfolio=instance,
                    signaletique=item['signaletique'],
                    ratio=item['ratio']
                )
                for item in items
            ])

        return instance


class TransactionSerializer(serializers.ModelSerializer):
    signaletique_display = serializers.CharField(source='signaletique.titre', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'


class RealPortfolioSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = RealPortfolio
        fields = ['id', 'name', 'description', 'date_creation', 'date_modification', 'transactions']
