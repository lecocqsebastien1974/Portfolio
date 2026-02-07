# Guide d'Import des Données

## 📥 Système d'Import Signalétique

L'environnement complet d'import de fichiers Excel est maintenant prêt !

### ✅ Fonctionnalités Mises en Place

**Backend (Django)** :
- ✅ Modèle `Signaletique` en base de données PostgreSQL
- ✅ Modèle `ImportLog` pour suivre les imports
- ✅ API d'import `/api/import/signaletique/`
- ✅ Support des fichiers .xlsx et .xls
- ✅ Détection automatique des colonnes
- ✅ Gestion des erreurs ligne par ligne
- ✅ Interface d'administration Django

**Frontend (React)** :
- ✅ Onglet "Signalétique Titre" dans la page Import
- ✅ Upload de fichier avec drag & drop
- ✅ Affichage du statut d'import en temps réel
- ✅ Messages de succès/erreur détaillés

### 🎯 Comment Utiliser

1. **Accédez à la page d'import** :
   - http://localhost:3001/admin/import

2. **Sélectionnez l'onglet "Signalétique Titre"**

3. **Cliquez sur "Choisir un fichier"** :
   - Sélectionnez votre fichier `Signalétique.xlsx`

4. **Cliquez sur "Importer"** :
   - Le fichier est envoyé au backend
   - Les données sont parsées et insérées en base de données
   - Vous recevez un rapport détaillé

### 📊 Structure de la Base de Données

**Table `Signaletique`** :
- `code` - Code unique (VARCHAR 100)
- `titre` - Titre (VARCHAR 500)
- `description` - Description (TEXT)
- `categorie` - Catégorie (VARCHAR 200)
- `statut` - Statut (VARCHAR 100)
- `donnees_supplementaires` - Données complètes en JSON
- `date_creation` - Date de création
- `date_modification` - Date de modification

**Table `ImportLog`** :
- Historique complet de tous les imports
- Nombre de lignes traitées
- Nombre de succès/erreurs
- Détails des erreurs

### 🔍 Vérifier les Données Importées

**Via l'API** :
```bash
curl http://localhost:8001/api/signaletique/
```

**Via l'Admin Django** :
1. Accédez à http://localhost:8001/admin
2. Créez un superuser si nécessaire :
```bash
docker exec -it portfolio_backend python manage.py createsuperuser
```

**Via pgAdmin ou psql** :
```sql
SELECT * FROM portfolios_signaletique;
SELECT * FROM portfolios_importlog;
```

### 🔧 Adapter à Votre Fichier Excel

Le système détecte automatiquement les colonnes. Si votre fichier a des colonnes spécifiques, modifiez le mapping dans :

`backend/portfolios/views.py` - fonction `import_signaletique`

Exemple de personnalisation :
```python
code = row_data.get('Votre_Colonne_Code')
titre = row_data.get('Votre_Colonne_Titre')
```

### ⚠️ Notes Importantes

- Le champ `code` doit être unique
- Si un code existe déjà, l'enregistrement sera mis à jour
- Toutes les données du fichier sont sauvegardées dans `donnees_supplementaires` (JSON)
- Les colonnes non mappées ne sont pas perdues

### 🔄 API Endpoints Disponibles

- `POST /api/import/signaletique/` - Import de fichier
- `GET /api/signaletique/` - Liste toutes les signalétiques
- `GET /api/import/logs/` - Historique des imports
- `GET /api/health/` - Vérification de l'API

### 📝 Exemple de Réponse d'Import

```json
{
  "success": true,
  "message": "Import terminé avec succès",
  "details": {
    "fichier": "Signalétique.xlsx",
    "colonnes_detectees": ["Code", "Titre", "Description", ...],
    "lignes_totales": 150,
    "succes": 148,
    "erreurs": 2,
    "liste_erreurs": [
      {"ligne": 25, "erreur": "..."},
      {"ligne": 89, "erreur": "..."}
    ]
  }
}
```

---

**Prêt à tester !** 🚀
Déposez votre fichier `Signalétique.xlsx` et lancez l'import !
