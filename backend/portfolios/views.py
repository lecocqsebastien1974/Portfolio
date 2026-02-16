from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.db import models
import openpyxl
import pandas as pd
import csv
import os
from datetime import date, datetime
from decimal import Decimal
from django.conf import settings
from .models import Signaletique, ImportLog, TargetPortfolio, RealPortfolio, Transaction
from .serializers import (
    SignaletiqueSerializer,
    ImportLogSerializer,
    TargetPortfolioSerializer,
    RealPortfolioSerializer,
    TransactionSerializer
)

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

        rows = list(ws.iter_rows(min_row=2, values_only=True))

        def sanitize_value(value):
            if isinstance(value, (datetime, date)):
                return value.isoformat()
            return value

        # Si la colonne ISIN existe, supprimer les lignes en base qui ne sont pas dans le fichier
        isin_header = next((h for h in headers if h in ['ISIN', 'Isin', 'isin']), None)
        if isin_header:
            isin_index = headers.index(isin_header)
            isin_values = set()
            for row in rows:
                isin_raw = row[isin_index] if isin_index < len(row) else None
                isin_value = str(isin_raw).strip() if isin_raw is not None else ''
                if isin_value:
                    isin_values.add(isin_value)

            if isin_values:
                Signaletique.objects.filter(
                    models.Q(isin__isnull=True) |
                    models.Q(isin='') |
                    ~models.Q(isin__in=isin_values)
                ).exclude(target_portfolio_items__isnull=False).delete()

        # Parcourir les lignes (à partir de la ligne 2)
        for row_idx, row in enumerate(rows, start=2):
            try:
                if not any(cell is not None and str(cell).strip() != '' for cell in row):
                    continue
                # Créer un dictionnaire avec les données de la ligne
                row_data = {
                    header: sanitize_value(value)
                    for header, value in zip(headers, row)
                }
                
                # Extraire les champs principaux (mapping adapté à Signalétique.xlsx)
                # Colonnes principales reconnaissables
                isin_raw = (
                    row_data.get('Isin') or 
                    row_data.get('ISIN') or 
                    row_data.get('isin')
                )
                isin_value = str(isin_raw).strip() if isin_raw is not None else None
                if isin_value == "":
                    isin_value = None
                
                # Code généré à partir de ISIN ou auto-incrémenté
                if isin_value:
                    code = f"SIG_{isin_value}"
                else:
                    code = f"AUTO_{row_idx}"
                
                titre = row_data.get('Nom') or ""
                
                description = (
                    row_data.get('Description') or 
                    row_data.get('description') or 
                    ""
                )
                
                categorie = row_data.get('Classe d\'actifs') or ""
                
                statut_data = row_data.get('Type d\'instr') or ""
                
                # Créer ou mettre à jour l'enregistrement
                defaults = {
                    'code': str(code),
                    'isin': isin_value,
                    'titre': str(titre)[:500],
                    'description': str(description) if description else None,
                    'categorie': str(categorie)[:200] if categorie else None,
                    'statut': str(statut_data)[:100] if statut_data else None,
                    'donnees_supplementaires': row_data
                }

                if not isin_value and not str(titre).strip():
                    continue

                if isin_value:
                    signaletique, created = Signaletique.objects.update_or_create(
                        isin=isin_value,
                        defaults=defaults
                    )
                else:
                    signaletique, created = Signaletique.objects.update_or_create(
                        code=str(code),
                        defaults=defaults
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


@api_view(['POST'])
def clear_signaletique(request):
    deleted_count = Signaletique.objects.count()
    Signaletique.objects.all().delete()
    return Response({'success': True, 'deleted': deleted_count})


@api_view(['GET'])
def export_signaletique_csv(request):
    """Exporter tous les titres de la signalétique en CSV"""
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="signaletique_export.csv"'
    response.write('\ufeff')  # BOM UTF-8 pour Excel
    
    writer = csv.writer(response)
    
    # Récupérer toutes les signalétiques
    signaletiques = Signaletique.objects.all()
    
    if not signaletiques.exists():
        writer.writerow(['Aucune donnée à exporter'])
        return response
    
    # Collecter tous les champs possibles
    all_fields = set()
    for sig in signaletiques:
        if sig.donnees_supplementaires:
            all_fields.update(sig.donnees_supplementaires.keys())
    
    # En-têtes : champs de base + champs supplémentaires
    headers = ['ID', 'Code', 'ISIN', 'Titre'] + sorted(all_fields)
    writer.writerow(headers)
    
    # Écrire les données
    for sig in signaletiques:
        row = [
            sig.id,
            sig.code,
            sig.isin or '',
            sig.titre
        ]
        
        # Ajouter les données supplémentaires
        ds = sig.donnees_supplementaires or {}
        for field in sorted(all_fields):
            value = ds.get(field, '')
            row.append(value if value is not None else '')
        
        writer.writerow(row)
    
    return response


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


@api_view(['GET', 'POST'])
def list_target_portfolios(request):
    if request.method == 'GET':
        portfolios = TargetPortfolio.objects.all()
        serializer = TargetPortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TargetPortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def target_portfolio_detail(request, pk):
    try:
        portfolio = TargetPortfolio.objects.get(pk=pk)
    except TargetPortfolio.DoesNotExist:
        return Response(
            {'error': 'Portefeuille cible non trouve'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = TargetPortfolioSerializer(portfolio)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = TargetPortfolioSerializer(portfolio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        portfolio.delete()
        return Response(
            {'success': True, 'message': 'Portefeuille cible supprime'},
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET', 'POST'])
def list_real_portfolios(request):
    """Liste ou crée des portefeuilles réels"""
    if request.method == 'GET':
        portfolios = RealPortfolio.objects.all()
        serializer = RealPortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = RealPortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def real_portfolio_detail(request, pk):
    """Récupère, modifie ou supprime un portefeuille réel"""
    try:
        portfolio = RealPortfolio.objects.get(pk=pk)
    except RealPortfolio.DoesNotExist:
        return Response(
            {'error': 'Portefeuille non trouve'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = RealPortfolioSerializer(portfolio)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = RealPortfolioSerializer(portfolio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        portfolio.delete()
        return Response(
            {'success': True, 'message': 'Portefeuille supprime'},
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def import_transactions(request):
    """Import des transactions d'achat/vente depuis un fichier Excel"""
    
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
        type_import='transactions',
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
        isins_inconnus = set()
        
        rows = list(ws.iter_rows(min_row=2, values_only=True))
        
        def sanitize_value(value):
            if isinstance(value, (datetime, date)):
                return value.date() if isinstance(value, datetime) else value
            return value
        
        # Parcourir les lignes
        for row_idx, row in enumerate(rows, start=2):
            try:
                if not any(cell is not None and str(cell).strip() != '' for cell in row):
                    continue
                
                # Créer un dictionnaire avec les données de la ligne
                row_data = {
                    header: sanitize_value(value)
                    for header, value in zip(headers, row)
                }
                
                # Extraire les champs avec plus de flexibilité
                date_transaction = row_data.get('Date') or row_data.get('date')
                
                # Type/Sens de l'opération
                type_operation = (
                    row_data.get('Type') or 
                    row_data.get('type') or 
                    row_data.get('Sens') or 
                    row_data.get('Sens ') or 
                    row_data.get('sens') or 
                    ''
                ).strip().upper()
                
                # ISIN
                isin = row_data.get('Isin') or row_data.get('ISIN') or row_data.get('isin')
                
                # Quantité
                quantite = (
                    row_data.get('quantité') or 
                    row_data.get('Quantité') or 
                    row_data.get('quantite') or
                    row_data.get('Quantite')
                )
                
                # Prix unitaire
                prix_unitaire = (
                    row_data.get('prix unitaire') or 
                    row_data.get('Prix unitaire') or 
                    row_data.get('Prix Unitaire') or
                    row_data.get('prix') or
                    row_data.get('Prix')
                )
                
                devise = row_data.get('Devise') or row_data.get('devise') or 'EUR'
                nom_portfolio = row_data.get('Portefeuille') or row_data.get('portefeuille') or 'Défaut'
                
                # Si date manquante, utiliser la date du jour
                if not date_transaction:
                    date_transaction = date.today()
                    erreurs.append({
                        'ligne': row_idx,
                        'erreur': 'Date manquante, date du jour utilisée'
                    })
                
                # Validation
                if not all([type_operation, isin, quantite, prix_unitaire]):
                    missing_fields = []
                    if not type_operation: missing_fields.append('Type/Sens')
                    if not isin: missing_fields.append('ISIN')
                    if not quantite: missing_fields.append('quantité')
                    if not prix_unitaire: missing_fields.append('prix')
                    
                    erreurs.append({
                        'ligne': row_idx,
                        'erreur': f'Champs obligatoires manquants: {", ".join(missing_fields)}'
                    })
                    nombre_erreurs += 1
                    continue
                
                # Normaliser le type
                if type_operation not in ['ACHAT', 'VENTE']:
                    type_operation = 'ACHAT' if 'achat' in type_operation.lower() else 'VENTE'
                
                # Récupérer ou créer le portefeuille
                portfolio, _ = RealPortfolio.objects.get_or_create(
                    name=nom_portfolio,
                    defaults={'description': f'Portefeuille {nom_portfolio}'}
                )
                
                # Récupérer la signalétique
                try:
                    signaletique = Signaletique.objects.get(isin=isin)
                except Signaletique.DoesNotExist:
                    # ISIN inconnu - ajouter à la liste et créer une signalétique temporaire
                    isins_inconnus.add(isin)
                    signaletique = Signaletique.objects.create(
                        code=f"TEMP_{isin}",
                        isin=isin,
                        titre=f"[À compléter] {isin}"
                    )
                    erreurs.append({
                        'ligne': row_idx,
                        'erreur': f"L'ISIN {isin} est inconnu du système portfolio"
                    })
                
                # Vérifier si la transaction existe déjà (doublon)
                quantite_decimal = Decimal(str(quantite))
                prix_unitaire_decimal = Decimal(str(prix_unitaire))
                
                existing_transaction = Transaction.objects.filter(
                    portfolio=portfolio,
                    signaletique=signaletique,
                    date=date_transaction,
                    type_operation=type_operation,
                    quantite=quantite_decimal,
                    prix_unitaire=prix_unitaire_decimal
                ).exists()
                
                if existing_transaction:
                    # Transaction déjà existante, on la saute
                    nombre_erreurs += 1
                    erreurs.append({
                        'ligne': row_idx,
                        'erreur': 'Transaction déjà importée (doublon détecté)'
                    })
                else:
                    # Créer la transaction
                    Transaction.objects.create(
                        portfolio=portfolio,
                        signaletique=signaletique,
                        date=date_transaction,
                        type_operation=type_operation,
                        quantite=quantite_decimal,
                        prix_unitaire=prix_unitaire_decimal,
                        devise=devise
                    )
                    
                    nombre_succes += 1
                
            except Exception as e:
                nombre_erreurs += 1
                erreurs.append({
                    'ligne': row_idx,
                    'erreur': str(e)
                })
        
        # Générer le fichier CSV pour les ISINs inconnus
        csv_file_url = None
        if isins_inconnus:
            # Créer le dossier media/imports s'il n'existe pas
            import_dir = os.path.join(settings.MEDIA_ROOT, 'imports')
            os.makedirs(import_dir, exist_ok=True)
            
            # Nom du fichier avec timestamp
            from datetime import datetime as dt
            timestamp = dt.now().strftime('%Y%m%d_%H%M%S')
            csv_filename = f'signaletique_isins_inconnus_{timestamp}.csv'
            csv_filepath = os.path.join(import_dir, csv_filename)
            
            # Créer le fichier CSV avec les en-têtes du template
            with open(csv_filepath, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.writer(csvfile)
                
                # En-têtes basés sur le template
                headers_csv = [
                    "Type d'instr", "Isin", "Classe d'actifs", "Nom", "Symbole", 
                    "Banques Dispo", "Devise", "Taux", "Date de fin", "Qualité credit",
                    "TER", "Cap/Dis", "ESG", "Replication", "Taille du Fonds", 
                    "Positions", "Couverture de change", "USA", "Japon", "Grande Bretagne",
                    "Canada", "Pays Emergeants Hors Chine et Japon", "Australie", "Suède",
                    "Suisse", "Chine", "Israel", "Allemagne", "Nouvelle Zelande", 
                    "Pays-Bas", "Irlande", "Espagne", "Italie", "France", "Autre Pays",
                    "Etats", "Industrie", "Finance", "Consommation Cyclique", "Technologie",
                    "Santé", "Consommation Defensive", "Communication", "Immobilier",
                    "Matières Premières", "Energie", "Service Publiques", 
                    "Services de consommation", "Autre Secteur", "Etats2", 
                    "Banque Emetteur", "Entreprises", "Autre Emetteur", "CodeBank"
                ]
                writer.writerow(headers_csv)
                
                # Ajouter une ligne pour chaque ISIN inconnu
                for isin in sorted(isins_inconnus):
                    row = [''] * len(headers_csv)
                    row[1] = isin  # Colonne "Isin"
                    row[3] = f'À compléter pour {isin}'  # Colonne "Nom"
                    writer.writerow(row)
            
            # URL relative pour le téléchargement
            csv_file_url = f'/media/imports/{csv_filename}'
        
        # Mettre à jour le log
        import_log.nombre_lignes = ws.max_row - 1
        import_log.nombre_succes = nombre_succes
        import_log.nombre_erreurs = nombre_erreurs
        import_log.erreurs = erreurs if erreurs else None
        import_log.statut = 'termine' if nombre_erreurs == 0 else 'termine_avec_erreurs'
        import_log.save()
        
        response_data = {
            'success': True,
            'message': f'Import terminé avec succès',
            'details': {
                'fichier': file.name,
                'colonnes_detectees': headers,
                'lignes_totales': ws.max_row - 1,
                'succes': nombre_succes,
                'erreurs': nombre_erreurs,
                'liste_erreurs': erreurs[:10] if erreurs else []
            }
        }
        
        # Ajouter l'info sur les ISINs inconnus
        if isins_inconnus:
            response_data['isins_inconnus'] = {
                'count': len(isins_inconnus),
                'liste': sorted(list(isins_inconnus)),
                'csv_file_url': csv_file_url
            }
        
        return Response(response_data)
        
    except Exception as e:
        import_log.statut = 'erreur'
        import_log.erreurs = [{'erreur_generale': str(e)}]
        import_log.save()
        
        return Response(
            {'error': f'Erreur lors de l\'import: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def list_transactions(request):
    """Liste toutes les transactions"""
    portfolio_id = request.GET.get('portfolio_id')
    
    if portfolio_id:
        transactions = Transaction.objects.filter(portfolio_id=portfolio_id)
    else:
        transactions = Transaction.objects.all()
    
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_transaction(request, pk):
    """Supprime une transaction"""
    try:
        transaction = Transaction.objects.get(pk=pk)
    except Transaction.DoesNotExist:
        return Response(
            {'error': 'Transaction non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    transaction.delete()
    return Response(
        {'success': True, 'message': 'Transaction supprimée'},
        status=status.HTTP_204_NO_CONTENT
    )


@api_view(['GET'])
def portfolio_fifo_analysis(request, pk):
    """Analyse FIFO d'un portefeuille : positions actuelles et P&L réalisé"""
    try:
        portfolio = RealPortfolio.objects.get(pk=pk)
    except RealPortfolio.DoesNotExist:
        return Response(
            {'error': 'Portefeuille non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Récupérer toutes les transactions triées par date
    transactions = Transaction.objects.filter(portfolio=portfolio).order_by('date', 'id')
    
    # Structure pour stocker les lots d'achat (FIFO)
    # positions[isin] = [(date, quantite, prix_unitaire), ...]
    positions = {}
    
    # P&L réalisé par titre
    realized_pnl = {}
    
    # Historique des transactions traitées
    transaction_details = []
    
    for transaction in transactions:
        isin = transaction.signaletique.isin or transaction.signaletique.code
        titre = transaction.signaletique.titre
        
        if transaction.type_operation == 'ACHAT':
            # Ajouter un lot d'achat
            if isin not in positions:
                positions[isin] = {
                    'titre': titre,
                    'lots': [],
                    'quantite_totale': Decimal('0')
                }
            
            positions[isin]['lots'].append({
                'date': transaction.date,
                'quantite': transaction.quantite,
                'prix_unitaire': transaction.prix_unitaire,
                'devise': transaction.devise
            })
            positions[isin]['quantite_totale'] += transaction.quantite
            
            transaction_details.append({
                'id': transaction.id,
                'date': transaction.date,
                'type': 'ACHAT',
                'titre': titre,
                'quantite': float(transaction.quantite),
                'prix_unitaire': float(transaction.prix_unitaire),
                'montant': float(transaction.quantite * transaction.prix_unitaire),
                'devise': transaction.devise
            })
            
        elif transaction.type_operation == 'VENTE':
            # Consommer les lots d'achat en FIFO
            if isin not in positions or positions[isin]['quantite_totale'] < transaction.quantite:
                # Vente à découvert ou erreur
                transaction_details.append({
                    'id': transaction.id,
                    'date': transaction.date,
                    'type': 'VENTE',
                    'titre': titre,
                    'quantite': float(transaction.quantite),
                    'prix_unitaire': float(transaction.prix_unitaire),
                    'montant': float(transaction.quantite * transaction.prix_unitaire),
                    'devise': transaction.devise,
                    'erreur': 'Vente sans achat correspondant'
                })
                continue
            
            quantite_a_vendre = transaction.quantite
            pnl_transaction = Decimal('0')
            lots_consommes = []
            
            while quantite_a_vendre > 0 and positions[isin]['lots']:
                lot = positions[isin]['lots'][0]
                
                if lot['quantite'] <= quantite_a_vendre:
                    # Consommer tout le lot
                    quantite_vendue = lot['quantite']
                    pnl_lot = quantite_vendue * (transaction.prix_unitaire - lot['prix_unitaire'])
                    pnl_transaction += pnl_lot
                    
                    lots_consommes.append({
                        'quantite': float(quantite_vendue),
                        'prix_achat': float(lot['prix_unitaire']),
                        'prix_vente': float(transaction.prix_unitaire),
                        'pnl': float(pnl_lot)
                    })
                    
                    quantite_a_vendre -= quantite_vendue
                    positions[isin]['quantite_totale'] -= quantite_vendue
                    positions[isin]['lots'].pop(0)
                    
                else:
                    # Consommer partiellement le lot
                    quantite_vendue = quantite_a_vendre
                    pnl_lot = quantite_vendue * (transaction.prix_unitaire - lot['prix_unitaire'])
                    pnl_transaction += pnl_lot
                    
                    lots_consommes.append({
                        'quantite': float(quantite_vendue),
                        'prix_achat': float(lot['prix_unitaire']),
                        'prix_vente': float(transaction.prix_unitaire),
                        'pnl': float(pnl_lot)
                    })
                    
                    lot['quantite'] -= quantite_vendue
                    positions[isin]['quantite_totale'] -= quantite_vendue
                    quantite_a_vendre = Decimal('0')
            
            # Enregistrer le P&L réalisé
            if isin not in realized_pnl:
                realized_pnl[isin] = {
                    'titre': titre,
                    'pnl_total': Decimal('0'),
                    'ventes': []
                }
            
            realized_pnl[isin]['pnl_total'] += pnl_transaction
            realized_pnl[isin]['ventes'].append({
                'date': transaction.date,
                'quantite': float(transaction.quantite),
                'prix_vente': float(transaction.prix_unitaire),
                'pnl': float(pnl_transaction),
                'lots_consommes': lots_consommes
            })
            
            transaction_details.append({
                'id': transaction.id,
                'date': transaction.date,
                'type': 'VENTE',
                'titre': titre,
                'quantite': float(transaction.quantite),
                'prix_unitaire': float(transaction.prix_unitaire),
                'montant': float(transaction.quantite * transaction.prix_unitaire),
                'devise': transaction.devise,
                'pnl': float(pnl_transaction),
                'lots_consommes': lots_consommes
            })
    
    # Nettoyer les positions vides
    positions_actuelles = []
    for isin, data in positions.items():
        if data['quantite_totale'] > 0:
            # Calculer le prix moyen pondéré des lots restants
            valeur_totale = sum(lot['quantite'] * lot['prix_unitaire'] for lot in data['lots'])
            prix_moyen = valeur_totale / data['quantite_totale'] if data['quantite_totale'] > 0 else Decimal('0')
            
            positions_actuelles.append({
                'isin': isin,
                'titre': data['titre'],
                'quantite': float(data['quantite_totale']),
                'prix_moyen': float(prix_moyen),
                'valeur': float(valeur_totale),
                'devise': data['lots'][0]['devise'] if data['lots'] else 'EUR',
                'lots': [
                    {
                        'date': lot['date'],
                        'quantite': float(lot['quantite']),
                        'prix_unitaire': float(lot['prix_unitaire'])
                    }
                    for lot in data['lots']
                ]
            })
    
    # Calculer le P&L total réalisé
    pnl_total_realise = sum(data['pnl_total'] for data in realized_pnl.values())
    
    # Formater le P&L réalisé
    pnl_realise_details = [
        {
            'isin': isin,
            'titre': data['titre'],
            'pnl_total': float(data['pnl_total']),
            'ventes': data['ventes']
        }
        for isin, data in realized_pnl.items()
    ]
    
    return Response({
        'portfolio': {
            'id': portfolio.id,
            'name': portfolio.name
        },
        'positions_actuelles': positions_actuelles,
        'pnl_realise': {
            'total': float(pnl_total_realise),
            'par_titre': pnl_realise_details
        },
        'transactions': transaction_details,
        'statistiques': {
            'nombre_transactions': len(transaction_details),
            'nombre_titres_en_portefeuille': len(positions_actuelles),
            'nombre_titres_vendus': len(pnl_realise_details)
        }
    })
