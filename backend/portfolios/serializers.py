from decimal import Decimal
from rest_framework import serializers
from .models import (
    Signaletique,
    ImportLog,
    TargetPortfolio,
    TargetPortfolioItem,
    RealPortfolio,
    Transaction
)


class SignaletiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signaletique
        fields = '__all__'


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
