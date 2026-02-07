# Dockerfile pour le backend Portfolio - Totalement isolé d'investment_game
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Variables d'environnement Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copier le code du projet
COPY . .

# Exposer le port 8001 (différent d'investment_game qui utilise 8000)
EXPOSE 8001

# Script de démarrage
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]
