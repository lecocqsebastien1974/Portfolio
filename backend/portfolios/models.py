from django.db import models

class Signaletique(models.Model):
    """Modèle pour stocker les données de signalétique titre"""
    
    # Champs génériques - à adapter selon la structure réelle du fichier Excel
    code = models.CharField(max_length=100, unique=True, verbose_name="Code")
    isin = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="ISIN")
    titre = models.CharField(max_length=500, verbose_name="Titre")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    categorie = models.CharField(max_length=200, blank=True, null=True, verbose_name="Catégorie")
    statut = models.CharField(max_length=100, blank=True, null=True, verbose_name="Statut")
    
    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    # Champ JSON pour stocker des données supplémentaires
    donnees_supplementaires = models.JSONField(blank=True, null=True, verbose_name="Données supplémentaires")
    
    class Meta:
        verbose_name = "Signalétique"
        verbose_name_plural = "Signalétiques"
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.code} - {self.titre}"


class ImportLog(models.Model):
    """Log des imports de fichiers"""
    
    TYPE_CHOICES = [
        ('signaletique', 'Signalétique'),
        ('pricing', 'Pricing'),
    ]
    
    type_import = models.CharField(max_length=50, choices=TYPE_CHOICES)
    nom_fichier = models.CharField(max_length=255)
    nombre_lignes = models.IntegerField(default=0)
    nombre_succes = models.IntegerField(default=0)
    nombre_erreurs = models.IntegerField(default=0)
    statut = models.CharField(max_length=50, default='en_cours')
    erreurs = models.JSONField(blank=True, null=True)
    date_import = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Log d'import"
        verbose_name_plural = "Logs d'import"
        ordering = ['-date_import']
    
    def __str__(self):
        return f"{self.type_import} - {self.nom_fichier} ({self.date_import})"


class TargetPortfolio(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name="Nom")
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Portefeuille cible"
        verbose_name_plural = "Portefeuilles cibles"
        ordering = ['-date_creation']

    def __str__(self):
        return self.name


class TargetPortfolioItem(models.Model):
    portfolio = models.ForeignKey(
        TargetPortfolio,
        on_delete=models.CASCADE,
        related_name='items'
    )
    signaletique = models.ForeignKey(
        Signaletique,
        on_delete=models.PROTECT,
        related_name='target_portfolio_items'
    )
    ratio = models.DecimalField(max_digits=7, decimal_places=2)

    class Meta:
        verbose_name = "Ligne portefeuille cible"
        verbose_name_plural = "Lignes portefeuille cible"
        unique_together = ('portfolio', 'signaletique')
        ordering = ['id']

    def __str__(self):
        return f"{self.portfolio.name} - {self.signaletique.code}"
