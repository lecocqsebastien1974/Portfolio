# Generated manually - Migration pour Cash

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('portfolios', '0006_asset_category_and_signaletique_update'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cash',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('banque', models.CharField(max_length=200, verbose_name='Banque')),
                ('montant', models.DecimalField(decimal_places=2, max_digits=15, verbose_name='Montant')),
                ('devise', models.CharField(default='EUR', max_length=10, verbose_name='Devise')),
                ('date', models.DateField(verbose_name='Date')),
                ('commentaire', models.TextField(blank=True, null=True, verbose_name='Commentaire')),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('portfolio', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='cash_entries',
                    to='portfolios.realportfolio',
                    verbose_name='Portefeuille'
                )),
            ],
            options={
                'verbose_name': 'Cash',
                'verbose_name_plural': 'Cash',
                'ordering': ['-date', '-date_creation'],
            },
        ),
    ]
