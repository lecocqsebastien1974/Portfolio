"""Audit complet : vérifier que tout est en JSON, rien de résiduel en DB."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio_backend.settings')
django.setup()

from django.db import connection
from portfolios import file_storage

print("=" * 55)
print("  AUDIT MIGRATION JSON vs POSTGRESQL")
print("=" * 55)

# ── 1. PostgreSQL ─────────────────────────────────────────────
print("\n[1] POSTGRESQL - tables user data")
tables = [
    ("portfolios_realportfolio",    "RealPortfolio",      False),
    ("portfolios_transaction",       "Transaction",        False),
    ("portfolios_targetportfolio",   "TargetPortfolio",    False),
    ("portfolios_targetportfolioitem","TargetPortfolioItem",False),
    ("portfolios_signaletique",      "Signaletique",       True),   # double-write OK
    ("portfolios_assetcategory",     "AssetCategory",      True),   # double-write OK
    ("portfolios_importlog",         "ImportLog",          True),   # logs uniquement
]
all_ok = True
with connection.cursor() as cursor:
    for table, label, is_doublewrite in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            if is_doublewrite:
                status = f"  (double-write attendu: {count})"
            elif count == 0:
                status = "  OK - vide"
            else:
                status = f"  !!! RESIDUEL: {count} lignes"
                all_ok = False
            print(f"  {label:30s} {count:5d}{status}")
        except Exception as e:
            print(f"  {label:30s}  erreur: {e}")

# ── 2. JSON files ────────────────────────────────────────────
print("\n[2] JSON FILES - contenu")
json_checks = [
    ("portfolios.json",       file_storage.get_all_portfolios()),
    ("transactions.json",     file_storage.get_all_transactions()),
    ("cash.json",             file_storage.get_all_cash()),
    ("target_portfolios.json",file_storage.get_all_target_portfolios()),
    ("signaletique.json",     file_storage.get_all_signaletiques()),
]
for fname, data in json_checks:
    print(f"  {fname:30s} {len(data):5d} enregistrements")

# ── 3. API endpoints smoke test ───────────────────────────────
print("\n[3] VIEWS - verification API interne")
import urllib.request, json as jlib

endpoints = [
    ("GET /api/portfolios/",        "http://localhost:8001/api/portfolios/"),
    ("GET /api/transactions/",      "http://localhost:8001/api/transactions/"),
    ("GET /api/cash/",              "http://localhost:8001/api/cash/"),
    ("GET /api/target-portfolios/", "http://localhost:8001/api/target-portfolios/"),
    ("GET /api/signaletique/",      "http://localhost:8001/api/signaletique/"),
]
for label, url in endpoints:
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            body = jlib.loads(r.read())
            count = len(body) if isinstance(body, list) else "non-list"
            print(f"  {label:35s} HTTP {r.status}  -> {count} items")
    except Exception as e:
        print(f"  {label:35s} ERREUR: {e}")

print("\n" + "=" * 55)
if all_ok:
    print("  RESULTAT: Migration OK - DB sans donnees residuelles")
else:
    print("  RESULTAT: ATTENTION - donnees residuelles en DB !")
print("=" * 55)
