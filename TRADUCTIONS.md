# Système de Traduction Portfolio

## 📚 Fichiers de traduction

Les traductions sont gérées dans les fichiers JSON :
- `frontend/src/translations/fr.json` - Traductions françaises
- `frontend/src/translations/en.json` - Traductions anglaises

## 🔧 Comment modifier les traductions

### Modifier une traduction existante

Éditez les fichiers JSON dans `frontend/src/translations/` :

```json
{
  "admin": {
    "title": "Administration"  // ← Changez le texte ici
  }
}
```

### Ajouter une nouvelle traduction

1. Ajoutez la clé dans **fr.json** :
```json
{
  "mySection": {
    "newText": "Mon nouveau texte"
  }
}
```

2. Ajoutez la même clé dans **en.json** :
```json
{
  "mySection": {
    "newText": "My new text"
  }
}
```

3. Utilisez-la dans votre composant :
```javascript
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  return <p>{t('mySection.newText')}</p>;
}
```

## 🌍 Sélecteur de langue

Un sélecteur FR/EN est disponible en haut à droite de chaque page.
Le choix de langue est sauvegardé dans le localStorage.

## ✨ Fonctionnalités

- ✅ Traductions FR/EN complètes
- ✅ Changement de langue en temps réel
- ✅ Sauvegarde automatique de la préférence
- ✅ Système extensible pour d'autres langues

## 🔄 Après modification

Après avoir modifié les fichiers de traduction, reconstruisez le frontend :

```bash
docker compose up -d --build portfolio_frontend
```
