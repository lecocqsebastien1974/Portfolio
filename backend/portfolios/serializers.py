from rest_framework import serializers
from .models import Signaletique, ImportLog


class SignaletiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signaletique
        fields = '__all__'


class ImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportLog
        fields = '__all__'
