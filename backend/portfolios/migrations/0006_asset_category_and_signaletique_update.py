# Generated manually - Migration pour AssetCategory

from django.db import migrations, models
import django.db.models.deletion


def copy_categorie_to_text(apps, schema_editor):
    """Copier les valeurs de categorie vers categorie_text"""
    Signaletique = apps.get_model('portfolios', 'Signaletique')
    for sig in Signaletique.objects.all():
        sig.categorie_text = sig.categorie
        sig.save(update_fields=['categorie_text'])


class Migration(migrations.Migration):

    dependencies = [
        ('portfolios', '0005_remove_actif_field'),
    ]

    operations = [
        # 1. Créer le modèle AssetCategory
        migrations.CreateModel(
            name='AssetCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True, verbose_name='Nom')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Description')),
                ('color', models.CharField(blank=True, max_length=7, null=True, verbose_name='Couleur (hex)')),
                ('ordre', models.IntegerField(default=0, verbose_name="Ordre d'affichage")),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': "Catégorie d'actif",
                'verbose_name_plural': "Catégories d'actifs",
                'ordering': ['ordre', 'name'],
            },
        ),
        
        # 2. Ajouter le champ categorie_text
        migrations.AddField(
            model_name='signaletique',
            name='categorie_text',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Catégorie (texte)'),
        ),
        
        # 3. Copier les données de categorie vers categorie_text
        migrations.RunPython(copy_categorie_to_text, migrations.RunPython.noop),
        
        # 4. Renommer categorie en categorie_old temporairement
        migrations.RenameField(
            model_name='signaletique',
            old_name='categorie',
            new_name='categorie_old_temp',
        ),
        
        # 5. Créer le nouveau champ categorie comme ForeignKey
        migrations.AddField(
            model_name='signaletique',
            name='categorie',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='signaletiques',
                to='portfolios.assetcategory',
                verbose_name='Catégorie'
            ),
        ),
        
        # 6. Supprimer l'ancien champ categorie_old_temp
        migrations.RemoveField(
            model_name='signaletique',
            name='categorie_old_temp',
        ),
    ]
