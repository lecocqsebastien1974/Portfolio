# Répertoire de données du portefeuille

Ce répertoire contient les données de portefeuille stockées sous forme de fichiers JSON.

## Fichiers

- **portfolios.json** : Liste des portefeuilles réels
- **transactions.json** : Liste des transactions (achats et ventes)
- **cash.json** : Liste des entrées de cash par portefeuille et banque

## Important

⚠️ **Si vous supprimez ce répertoire ou son contenu, toutes les données de portefeuille seront perdues !**

Les données sont stockées localement dans ces fichiers JSON au lieu d'être dans la base de données. Cela signifie que :

- Les données sont facilement portables (vous pouvez copier ce répertoire)
- Les données sont lisibles et modifiables manuellement si nécessaire
- La suppression du répertoire entraîne la perte de toutes les données

## Format des fichiers

Tous les fichiers utilisent le format JSON avec encodage UTF-8.

### portfolios.json
```json
[
  {
    "id": 1,
    "name": "Mon Portefeuille",
    "description": "Description du portefeuille",
    "date_creation": "2026-03-09T...",
    "date_modification": "2026-03-09T..."
  }
]
```

### transactions.json
```json
[
  {
    "id": 1,
    "portfolio_id": 1,
    "signaletique_id": 123,
    "date": "2026-03-09",
    "type_operation": "ACHAT",
    "quantite": "100.0000",
    "prix_unitaire": "50.25",
    "devise": "EUR",
    "date_creation": "2026-03-09T..."
  }
]
```

### cash.json
```json
[
  {
    "id": 1,
    "portfolio_id": 1,
    "banque": "BNP Paribas",
    "montant": "10000.00",
    "devise": "EUR",
    "date": "2026-03-09",
    "commentaire": "Solde initial",
    "date_creation": "2026-03-09T...",
    "date_modification": "2026-03-09T..."
  }
]
```

## Sauvegarde

Il est recommandé de sauvegarder régulièrement ce répertoire pour éviter toute perte de données.
