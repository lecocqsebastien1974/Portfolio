# Application de Gestion de Portefeuilles

Application full-stack pour gérer des portefeuilles d'investissement avec suivi des actifs, transactions et performance.

## 🏗️ Architecture

- **Backend**: Django REST Framework
- **Frontend**: React
- **Base de données**: SQLite (par défaut)

## 📁 Structure du projet

```
Portfolio/
├── backend/                    # API Django
│   ├── portfolio_backend/     # Configuration Django
│   ├── portfolios/            # App principale
│   ├── manage.py
│   └── requirements.txt
├── frontend/                  # Application React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🚀 Installation et démarrage

### Backend (Django)

1. Créer un environnement virtuel Python:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Installer les dépendances:
```powershell
pip install -r requirements.txt
```

3. Créer la base de données:
```powershell
python manage.py makemigrations
python manage.py migrate
```

4. Créer un superutilisateur (optionnel):
```powershell
python manage.py createsuperuser
```

5. Lancer le serveur:
```powershell
python manage.py runserver
```

Le backend sera accessible sur `http://localhost:8000`

### Frontend (React)

1. Installer les dépendances:
```powershell
cd frontend
npm install
```

2. Lancer l'application:
```powershell
npm start
```

Le frontend sera accessible sur `http://localhost:3000`

## 📊 Fonctionnalités

### Portefeuilles
- Créer, modifier et supprimer des portefeuilles
- Définir un solde initial
- Voir les statistiques globales

### Actifs
- Ajouter des actifs (actions, cryptomonnaies, ETF, etc.)
- Suivre la quantité, prix d'achat et prix actuel
- Calculer automatiquement les gains/pertes
- Visualiser la performance en pourcentage

### Statistiques
- Valeur totale du portefeuille
- Capital investi
- Gains/pertes totaux
- Répartition par type d'actif

## 🔧 API Endpoints

### Portefeuilles
- `GET /api/portfolios/` - Liste tous les portefeuilles
- `POST /api/portfolios/` - Créer un portefeuille
- `GET /api/portfolios/{id}/` - Détails d'un portefeuille
- `PUT /api/portfolios/{id}/` - Modifier un portefeuille
- `DELETE /api/portfolios/{id}/` - Supprimer un portefeuille
- `GET /api/portfolios/{id}/stats/` - Statistiques d'un portefeuille

### Actifs
- `GET /api/assets/` - Liste tous les actifs
- `POST /api/assets/` - Ajouter un actif
- `GET /api/assets/{id}/` - Détails d'un actif
- `PUT /api/assets/{id}/` - Modifier un actif
- `DELETE /api/assets/{id}/` - Supprimer un actif

### Transactions
- `GET /api/transactions/` - Liste toutes les transactions
- `POST /api/transactions/` - Créer une transaction
- `GET /api/transactions/{id}/` - Détails d'une transaction

## 🔗 Connexion GitHub

Le projet est connecté à GitHub. Pour pousser les modifications :
```powershell
git add .
git commit -m "votre message"
git push origin main
```

## 🔐 Sécurité

⚠️ **Important pour la production:**
- Changer le `SECRET_KEY` dans `settings.py`
- Mettre `DEBUG = False`
- Configurer `ALLOWED_HOSTS`
- Utiliser une base de données PostgreSQL
- Configurer HTTPS
- Ajouter l'authentification JWT

## 📝 Notes

- Les montants sont en euros (€)
- Les dates sont au format français
- L'interface est en français
- CORS configuré pour le développement local

## 🛠️ Technologies utilisées

### Backend
- Django 5.0.1
- Django REST Framework 3.14.0
- django-cors-headers 4.3.1

### Frontend
- React 18.2.0
- React Router 6.21.3
- Axios 1.6.5
- Recharts 2.10.4 (graphiques)

## 📞 Support

Pour toute question ou problème, consultez la documentation Django et React.
