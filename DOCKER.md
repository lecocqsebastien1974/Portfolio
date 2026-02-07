# Portfolio - Guide de Démarrage Docker

## 🔒 Isolation Garantie
Ce projet est **totalement isolé** d'investment_game :
- ✅ Noms de containers avec préfixe `portfolio_`
- ✅ Réseau Docker dédié `portfolio_network`
- ✅ Base de données séparée `portfolio_db`
- ✅ Ports différents (3001, 8001, 5433)
- ✅ Volumes dédiés avec préfixe `portfolio_`

## 🚀 Démarrage Rapide

### 1. Créer le fichier .env
```bash
cp .env.example .env
# Éditez .env si nécessaire
```

### 2. Lancer les containers
```bash
docker-compose up -d
```

### 3. Accéder à l'application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **PostgreSQL**: localhost:5433

## 📦 Containers Portfolio
Les containers suivants seront créés :
- `portfolio_frontend` - React sur port 3001
- `portfolio_backend` - Django sur port 8001
- `portfolio_db` - PostgreSQL sur port 5433

## 🛠️ Commandes Utiles

```bash
# Voir les containers Portfolio
docker ps --filter name=portfolio

# Logs d'un service
docker-compose logs -f portfolio_backend

# Arrêter les containers
docker-compose down

# Rebuild après modifications
docker-compose up -d --build

# Accéder au shell Django
docker exec -it portfolio_backend python manage.py shell

# Créer un superuser
docker exec -it portfolio_backend python manage.py createsuperuser
```

## ⚠️ Important
- Ce projet n'interfère **en aucun cas** avec investment_game
- Les deux projets peuvent tourner simultanément
- Bases de données complètement séparées
