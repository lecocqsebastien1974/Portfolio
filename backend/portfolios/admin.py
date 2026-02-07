from django.contrib import admin
from .models import Signaletique, ImportLog

@admin.register(Signaletique)
class SignaletiqueAdmin(admin.ModelAdmin):
    list_display = ('code', 'titre', 'categorie', 'statut', 'date_creation')
    list_filter = ('categorie', 'statut', 'date_creation')
    search_fields = ('code', 'titre', 'description')
    readonly_fields = ('date_creation', 'date_modification')

@admin.register(ImportLog)
class ImportLogAdmin(admin.ModelAdmin):
    list_display = ('type_import', 'nom_fichier', 'nombre_lignes', 'nombre_succes', 'nombre_erreurs', 'statut', 'date_import')
    list_filter = ('type_import', 'statut', 'date_import')
    readonly_fields = ('date_import',)
