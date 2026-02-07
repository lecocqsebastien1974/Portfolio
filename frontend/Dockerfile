# Dockerfile pour le frontend Portfolio - Totalement isolé d'investment_game

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Build de l'application
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/build /usr/share/nginx/html

# Exposer le port 3001 (différent d'investment_game qui utilise 3000)
EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
