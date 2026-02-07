from django.shortcuts import render
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
import openpyxl
import pandas as pd
from .models import Signaletique, ImportLog
from .serializers import SignaletiqueSerializer, ImportLogSerializer

@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'message': 'Portfolio API is running'})


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def import_signaletique(request):
    """Import des données de signalétique depuis un fichier Excel"""
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'Aucun fichier fourni'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Vérifier l'extension
    if not file.name.endswith(('.xlsx', '.xls')):
        return Response(
            {'error': 'Format de fichier non supporté. Utilisez .xlsx ou .xls'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Créer un log d'import
    import_log = ImportLog.objects.create(
        type_import='signaletique',
        nom_fichier=file.name,
        statut='en_cours'
    )
    
    try:
        # Lire le fichier Excel
        wb = openpyxl.load_workbook(file)
        ws = wb.active
        
        # Récupérer les en-têtes (première ligne)
        headers = [cell.value for cell in ws[1]]
        
        nombre_succes = 0
        nombre_erreurs = 0
        erreurs = []
        
        # Parcourir les lignes (à partir de la ligne 2)
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            try:
                # Créer un dictionnaire avec les données de la ligne
                row_data = dict(zip(headers, row))
                
                # Extraire les champs principaux (à adapter selon votre fichier)
                # Exemple de mapping - ajustez selon vos colonnes
                code = row_data.get('Code') or row_data.get('code') or f"AUTO_{row_idx}"
                titre = row_data.get('Titre') or row_data.get('titre') or row_data.get('Title') or ""
                description = row_data.get('Description') or row_data.get('description') or ""
                categorie = row_data.get('Catégorie') or row_data.get('categorie') or row_data.get('Category') or ""
                statut_data = row_data.get('Statut') or row_data.get('statut') or row_data.get('Status') or ""
                
                # Créer ou mettre à jour l'enregistrement
                signaletique, created = Signaletique.objects.update_or_create(
                    code=str(code),
                    defaults={
                        'titre': str(titre)[:500],
                        'description': str(description) if description else None,
                        'categorie': str(categorie)[:200] if categorie else None,
                        'statut': str(statut_data)[:100] if statut_data else None,
                        'donnees_supplementaires': row_data
                    }
                )
                
                nombre_succes += 1
                
            except Exception as e:
                nombre_erreurs += 1
                erreurs.append({
                    'ligne': row_idx,
                    'erreur': str(e)
                })
        
        # Mettre à jour le log
        import_log.nombre_lignes = ws.max_row - 1
        import_log.nombre_succes = nombre_succes
        import_log.nombre_erreurs = nombre_erreurs
        import_log.erreurs = erreurs if erreurs else None
        import_log.statut = 'termine' if nombre_erreurs == 0 else 'termine_avec_erreurs'
        import_log.save()
        
        return Response({
            'success': True,
            'message': f'Import terminé avec succès',
            'details': {
                'fichier': file.name,
                'colonnes_detectees': headers,
                'lignes_totales': ws.max_row - 1,
                'succes': nombre_succes,
                'erreurs': nombre_erreurs,
                'liste_erreurs': erreurs[:10] if erreurs else []  # Limiter à 10 erreurs
            }
        })
        
    except Exception as e:
        import_log.statut = 'erreur'
        import_log.erreurs = [{'erreur_generale': str(e)}]
        import_log.save()
        
        return Response(
            {'error': f'Erreur lors de l\'import: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
def list_signaletique(request):
    """Lister ou créer des signalétiques"""
    if request.method == 'GET':
        signaletiques = Signaletique.objects.all()
        serializer = SignaletiqueSerializer(signaletiques, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SignaletiqueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def signaletique_detail(request, pk):
    """Récupérer, modifier ou supprimer une signalétique"""
    try:
        signaletique = Signaletique.objects.get(pk=pk)
    except Signaletique.DoesNotExist:
        return Response(
            {'error': 'Signalétique non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = SignaletiqueSerializer(signaletique)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SignaletiqueSerializer(signaletique, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        signaletique.delete()
        return Response(
            {'success': True, 'message': 'Signalétique supprimée'},
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET'])
def import_logs(request):
    """Liste des logs d'import"""
    logs = ImportLog.objects.all()[:20]  # 20 derniers logs
    serializer = ImportLogSerializer(logs, many=True)
    return Response(serializer.data)
