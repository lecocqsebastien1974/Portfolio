# Fonctionnalité de Gestion du Cash

## Description

Un système de gestion du cash a été ajouté à l'application Portfolio. Cette fonctionnalité permet de :
- Enregistrer des soldes de cash par portefeuille et banque
- Suivre l'évolution du cash dans le temps
- Gérer plusieurs banques pour un même portefeuille
- Ajouter des commentaires optionnels

## Modifications apportées

### Backend (Django)

1. **Nouveau modèle `Cash`** ([backend/portfolios/models.py](backend/portfolios/models.py))
   - `portfolio`: ForeignKey vers RealPortfolio
   - `banque`: Nom de la banque (CharField)
   - `montant`: Montant en décimal (15 chiffres, 2 décimales)
   - `devise`: Devise (EUR par défaut)
   - `date`: Date du solde
   - `commentaire`: Commentaire optionnel
   - `date_creation` et `date_modification`: Métadonnées automatiques

2. **Serializer `CashSerializer`** ([backend/portfolios/serializers.py](backend/portfolios/serializers.py))
   - Sérialisation/désérialisation du modèle Cash
   - Inclusion du nom du portfolio en lecture seule

3. **Endpoints API** ([backend/portfolios/views.py](backend/portfolios/views.py))
   - `GET /api/cash/` : Lister toutes les entrées de cash (filtre optionnel par portfolio_id)
   - `POST /api/cash/` : Créer une nouvelle entrée de cash
   - `GET /api/cash/<id>/` : Récupérer une entrée spécifique
   - `PUT /api/cash/<id>/` : Modifier une entrée
   - `DELETE /api/cash/<id>/` : Supprimer une entrée

4. **URLs** ([backend/portfolios/urls.py](backend/portfolios/urls.py))
   - Ajout des routes pour les endpoints cash

5. **Admin Django** ([backend/portfolios/admin.py](backend/portfolios/admin.py))
   - Interface d'administration pour gérer les entrées de cash

6. **Migration** ([backend/portfolios/migrations/0007_cash.py](backend/portfolios/migrations/0007_cash.py))
   - Migration Django pour créer la table Cash

### Frontend (React)

1. **Composant Portfolios** ([frontend/src/components/Portfolios.js](frontend/src/components/Portfolios.js))
   - Nouvelle section "Gestion du Cash"
   - Formulaire de saisie avec les champs :
     - Portefeuille (sélection depuis les portfolios existants)
     - Banque (saisie libre)
     - Montant (nombre décimal)
     - Devise (EUR, USD, GBP, CHF)
     - Date
     - Commentaire (optionnel)
   - Liste des entrées de cash avec possibilité de suppression
   - Messages de succès/erreur

## Installation et Déploiement

### Étape 1 : Appliquer la migration

Si Docker est déjà en cours d'exécution :
```bash
docker compose exec backend python manage.py migrate
```

Si Docker n'est pas lancé, démarrez les services :
```bash
docker compose up -d
docker compose exec backend python manage.py migrate
```

### Étape 2 : Redémarrer les services (si nécessaire)

```bash
docker compose restart
```

## Utilisation

1. Accédez à http://localhost:3001/portfolios
2. Descendez jusqu'à la section "💰 Gestion du Cash"
3. Cliquez sur "➕ Ajouter une entrée de cash"
4. Remplissez le formulaire :
   - Sélectionnez un portefeuille existant
   - Entrez le nom de la banque
   - Saisissez le montant
   - Choisissez la devise
   - Sélectionnez la date
   - Ajoutez un commentaire si nécessaire
5. Cliquez sur "💾 Enregistrer"

Les entrées de cash s'affichent dans la liste en dessous, avec la possibilité de les supprimer.

## API Endpoints

### Lister les entrées de cash
```
GET /api/cash/
GET /api/cash/?portfolio_id=1  (filtrer par portfolio)
```

### Créer une entrée de cash
```
POST /api/cash/
Content-Type: application/json

{
  "portfolio": 1,
  "banque": "BNP Paribas",
  "montant": "10000.00",
  "devise": "EUR",
  "date": "2026-03-08",
  "commentaire": "Solde initial"
}
```

### Récupérer une entrée spécifique
```
GET /api/cash/1/
```

### Modifier une entrée
```
PUT /api/cash/1/
Content-Type: application/json

{
  "portfolio": 1,
  "banque": "BNP Paribas",
  "montant": "12000.00",
  "devise": "EUR",
  "date": "2026-03-08",
  "commentaire": "Solde mis à jour"
}
```

### Supprimer une entrée
```
DELETE /api/cash/1/
```

## Notes

- Le montant est stocké avec 2 décimales de précision
- La devise par défaut est EUR
- Les entrées sont triées par date décroissante
- Chaque entrée est liée à un portefeuille existant
- La suppression d'un portefeuille supprimera automatiquement toutes ses entrées de cash (CASCADE)
