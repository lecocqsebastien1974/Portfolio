# Migration vers le stockage de fichiers pour les données de portefeuille

## Modifications effectuées

### 1. Nouveau module `file_storage.py`

Un nouveau module a été créé dans `backend/portfolios/file_storage.py` pour gérer le stockage des données de portefeuille dans des fichiers JSON au lieu de la base de données.

#### Répertoire de stockage

Les données sont stockées dans : `C:\Users\seble\Code\env\Portfolio\data`

#### Fichiers JSON créés

- **portfolios.json** : Portefeuilles réels
- **transactions.json** : Transactions d'achat et de vente
- **cash.json** : Soldes de cash par portefeuille

### 2. Modifications dans `views.py`

Les vues suivantes ont été modifiées pour utiliser le stockage de fichiers :

#### Portefeuilles (RealPortfolio)
- `list_real_portfolios()` : Liste et création de portefeuilles
- `real_portfolio_detail()` : Récupération, modification et suppression de portefeuilles

#### Transactions
- `import_transactions()` : Import de transactions depuis Excel
- `list_transactions()` : Liste des transactions avec enrichissement des données
- `delete_transaction()` : Suppression de transactions
- `portfolio_fifo_analysis()` : Analyse FIFO des positions et P&L

#### Cash
- `list_cash()` : Liste et création d'entrées de cash
- `cash_detail()` : Récupération, modification et suppression de cash

### 3. Données conservées dans la base de données

Les modèles suivants restent dans la base de données :
- **Signaletique** : Données de référence des titres
- **AssetCategory** : Catégories d'actifs
- **ImportLog** : Logs d'import
- **TargetPortfolio** : Portefeuilles cibles et leurs lignes

## Impact sur l'utilisation

### Avantages

1. **Données portables** : Les fichiers JSON peuvent être facilement copiés, sauvegardés ou versionnés
2. **Lecture facile** : Les données sont lisibles en texte clair
3. **Suppression simple** : Supprimer le répertoire `data` supprime toutes les données
4. **Pas de migration de base de données** : Les changements de structure ne nécessitent pas de migrations

### Avertissements

⚠️ **Important** : Si vous supprimez le répertoire `data` ou son contenu, toutes les données de portefeuille seront perdues !

### Comportement automatique

- Le répertoire `data` est créé automatiquement s'il n'existe pas
- Les fichiers JSON sont créés automatiquement lors de la première opération
- Les erreurs de lecture sont gérées avec des valeurs par défaut (listes vides)

## Comment tester

### 1. Démarrer le backend Django

```powershell
cd C:\Users\seble\Code\env\Portfolio\backend
python manage.py runserver
```

### 2. Tester la création d'un portefeuille

Via l'API REST :
```bash
POST http://localhost:8000/api/portfolios/real/
{
  "name": "Mon Portefeuille Test",
  "description": "Description du test"
}
```

### 3. Vérifier les fichiers créés

Vérifiez que le fichier `data/portfolios.json` a été créé avec le portefeuille.

### 4. Importer des transactions

Utilisez la fonction d'import existante via l'interface frontend ou l'API.

### 5. Supprimer le répertoire data

Pour tester que les données disparaissent bien :
```powershell
Remove-Item -Recurse -Force C:\Users\seble\Code\env\Portfolio\data
```

Puis relancez l'API et vérifiez que la liste des portefeuilles est vide.

## Compatibilité avec l'existant

### Migration des données existantes

Si vous avez des données existantes dans la base de données, vous devez créer un script de migration :

```python
# backend/migrate_to_files.py
import sys
import os
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from portfolios.models import RealPortfolio, Transaction, Cash
from portfolios import file_storage

# Migrer les portefeuilles
for portfolio in RealPortfolio.objects.all():
    file_storage.create_portfolio(
        portfolio.name,
        portfolio.description
    )
    print(f"Migré: {portfolio.name}")

# Migrer les transactions
for transaction in Transaction.objects.all():
    portfolio = file_storage.get_portfolio_by_name(transaction.portfolio.name)
    if portfolio:
        file_storage.create_transaction(
            portfolio['id'],
            transaction.signaletique.id,
            transaction.date,
            transaction.type_operation,
            transaction.quantite,
            transaction.prix_unitaire,
            transaction.devise
        )
        print(f"Transaction migrée: {transaction.id}")

# Migrer les cash
for cash in Cash.objects.all():
    portfolio = file_storage.get_portfolio_by_name(cash.portfolio.name)
    if portfolio:
        file_storage.create_cash(
            portfolio['id'],
            cash.banque,
            cash.montant,
            cash.devise,
            cash.date,
            cash.commentaire
        )
        print(f"Cash migré: {cash.id}")

print("Migration terminée!")
```

### Suppression des anciens modèles (optionnel)

Si vous souhaitez supprimer les modèles Django inutilisés après la migration :

1. Commentez ou supprimez les modèles `RealPortfolio`, `Transaction` et `Cash` dans `models.py`
2. Créez et appliquez une migration Django pour supprimer les tables :
```powershell
python manage.py makemigrations
python manage.py migrate
```

## Sauvegarde et restauration

### Sauvegarde

Pour sauvegarder vos données :
```powershell
Copy-Item -Recurse C:\Users\seble\Code\env\Portfolio\data C:\backup\portfolio_data_$(Get-Date -Format 'yyyyMMdd_HHmmss')
```

### Restauration

Pour restaurer des données :
```powershell
Copy-Item -Recurse C:\backup\portfolio_data_20260309_120000 C:\Users\seble\Code\env\Portfolio\data -Force
```

## Gestion des versions avec Git

Vous pouvez ajouter le répertoire `data` au contrôle de version Git si vous souhaitez versionner vos données :

```powershell
git add data/
git commit -m "Ajout des données de portefeuille"
```

Ou l'ignorer en ajoutant à `.gitignore` :
```
data/*.json
```

## Support et dépannage

### Le répertoire data n'existe pas

Le module `file_storage` crée automatiquement le répertoire lors de la première écriture.

### Erreur de lecture des fichiers JSON

Si un fichier JSON est corrompu, supprimez-le et il sera recréé vide.

### Les données ne s'affichent pas

Vérifiez que :
1. Le serveur Django est démarré
2. Le répertoire `data` contient les fichiers JSON
3. Les fichiers JSON ne sont pas vides
4. Le format JSON est valide

### Restaurer des données perdues

Si vous avez supprimé le répertoire `data` par accident :
1. Restaurez depuis une sauvegarde
2. Ou relancez l'import depuis vos fichiers Excel sources
