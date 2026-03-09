# Module de gestion du stockage des données de portefeuille dans des fichiers JSON.
# Les données sont stockées dans /app/data (monté depuis C:/Users/seble/Code/env/Portfolio/data)
# Si le répertoire est supprimé, les données disparaissent.

import json
import os
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any, Optional
import shutil

# Répertoire de stockage des données (chemin dans le conteneur Docker)
DATA_DIR = "/app/data"

# Chemins des fichiers JSON
PORTFOLIOS_FILE = os.path.join(DATA_DIR, "portfolios.json")
TRANSACTIONS_FILE = os.path.join(DATA_DIR, "transactions.json")
CASH_FILE = os.path.join(DATA_DIR, "cash.json")
TARGET_PORTFOLIOS_FILE = os.path.join(DATA_DIR, "target_portfolios.json")
SIGNALETIQUE_FILE = os.path.join(DATA_DIR, "signaletique.json")
PRIX_HISTORIQUE_KOALA_FILE = os.path.join(DATA_DIR, "prix_historique_koala.json")
PRIX_HISTORIQUE_BONOBO_FILE = os.path.join(DATA_DIR, "prix_historique_bonobo.json")


# ---------------------------------------------------------------------------
# Historique de prix – Import source Koala
# ---------------------------------------------------------------------------

def get_prix_historique_koala() -> Dict:
    """Retourne tout l'historique de prix Koala (dict identifiant → [entrées])"""
    return _read_json_file(PRIX_HISTORIQUE_KOALA_FILE, {})


def get_prix_historique_bonobo() -> Dict:
    """Retourne tout l'historique de prix Bonobo (dict identifiant → [entrées])"""
    return _read_json_file(PRIX_HISTORIQUE_BONOBO_FILE, {})


def append_prix_bonobo(rows: List[Dict]) -> Dict:
    """
    Ajoute des entrées dans l'historique Bonobo.
    rows: liste de {isin, cours, devise, date_import}
    Retourne des stats {ajoutés, ignorés}.
    Un seul prix par (isin, date_import) — le dernier reçu écrase le précédent.
    """
    historique = _read_json_file(PRIX_HISTORIQUE_BONOBO_FILE, {})
    ajoutes = 0
    ignores = 0
    for row in rows:
        isin = str(row.get('isin', '')).strip()
        cours = row.get('cours')
        if not isin or cours is None:
            ignores += 1
            continue
        entree = {
            'cours': float(cours),
            'date_import': row.get('date_import', datetime.now().date().isoformat()),
            'devise': row.get('devise', 'EUR'),
        }
        if isin not in historique:
            historique[isin] = []
        # Dédoublonnage : remplace l'entrée de même date si elle existe déjà
        date_cle = entree['date_import']
        historique[isin] = [e for e in historique[isin] if e.get('date_import') != date_cle]
        historique[isin].append(entree)
        ajoutes += 1
    _write_json_file(PRIX_HISTORIQUE_BONOBO_FILE, historique)
    return {'ajoutes': ajoutes, 'ignores': ignores}


def append_prix_koala(rows: List[Dict]) -> Dict:
    """
    Ajoute des entrées dans l'historique Koala.
    rows: liste de {symbole, cours, date_import, devise}
    Retourne des stats {ajoutés, ignorés}.
    Un seul prix par (symbole, date_import) — le dernier reçu écrase le précédent.
    """
    historique = _read_json_file(PRIX_HISTORIQUE_KOALA_FILE, {})
    ajoutes = 0
    ignores = 0
    for row in rows:
        symbole = str(row.get('symbole', '')).strip()
        cours = row.get('cours')
        if not symbole or cours is None:
            ignores += 1
            continue
        entree = {
            'cours': float(cours),
            'date_import': row.get('date_import', datetime.now().date().isoformat()),
            'devise': row.get('devise', 'EUR'),
        }
        if symbole not in historique:
            historique[symbole] = []
        # Dédoublonnage : remplace l'entrée de même date si elle existe déjà
        date_cle = entree['date_import']
        historique[symbole] = [e for e in historique[symbole] if e.get('date_import') != date_cle]
        historique[symbole].append(entree)
        ajoutes += 1
    _write_json_file(PRIX_HISTORIQUE_KOALA_FILE, historique)
    return {'ajoutes': ajoutes, 'ignores': ignores}


# ---------------------------------------------------------------------------
# Historique de prix – consolidé par titre (Koala + Bonobo → prix_historique_titres)
# ---------------------------------------------------------------------------

PRIX_HISTORIQUE_TITRES_FILE = os.path.join(DATA_DIR, "prix_historique_titres.json")


def get_prix_historique_titres() -> Dict:
    """Retourne l'historique consolidé de prix par ISIN"""
    return _read_json_file(PRIX_HISTORIQUE_TITRES_FILE, {})


def get_prix_titre_by_isin(isin: str) -> Optional[Dict]:
    """Retourne l'historique de prix pour un titre donné par ISIN"""
    return _read_json_file(PRIX_HISTORIQUE_TITRES_FILE, {}).get(isin)


def rebuild_prix_historique_titres() -> Dict:
    """
    Consolide les historiques Koala (par Symbole) et Bonobo (par ISIN)
    vers prix_historique_titres.json, clé = ISIN.
    - Koala  : match par donnees_supplementaires['Symbole']
    - Bonobo : match par signaletique.isin
    - Devise '%' (Bonobo) : remplacée par la devise de référence du titre
    """
    sigs = get_all_signaletiques()
    koala = _read_json_file(PRIX_HISTORIQUE_KOALA_FILE, {})
    bonobo = _read_json_file(PRIX_HISTORIQUE_BONOBO_FILE, {})

    # Index signaletiques par ISIN
    isin_to_sig = {sig['isin']: sig for sig in sigs if sig.get('isin')}

    # Index signaletiques par Symbole (champ dans donnees_supplementaires)
    symbole_to_sig = {}
    for sig in sigs:
        ds = sig.get('donnees_supplementaires') or {}
        symbole = ds.get('Symbole') or ds.get('CodeBank')
        if symbole and str(symbole).strip():
            symbole_to_sig[str(symbole).strip()] = sig

    titres: Dict = {}

    def _get_or_create(isin, sig):
        if isin not in titres:
            ds = sig.get('donnees_supplementaires') or {}
            devise_ref = str(ds.get('Devise') or 'EUR').strip()
            titres[isin] = {
                'isin': isin,
                'nom': sig.get('titre', ''),
                'signaletique_id': sig.get('id'),
                'devise_ref': devise_ref,
                'historique': [],
            }
        return titres[isin]

    # ── Koala ──
    for symbole, entries in koala.items():
        sig = symbole_to_sig.get(symbole)
        if not sig:
            continue
        isin = sig.get('isin') or f"SYM_{symbole}"
        titre = _get_or_create(isin, sig)
        devise_ref = titre['devise_ref']
        for idx, entry in enumerate(entries):
            titre['historique'].append({
                'id': f"{isin}_{entry.get('date_import', '')}_{idx}_koala",
                'date': entry.get('date_import', ''),
                'cours': entry.get('cours'),
                'devise': entry.get('devise') or devise_ref,
                'source': 'koala',
                'symbole': symbole,
            })

    # ── Bonobo ──
    for isin, entries in bonobo.items():
        sig = isin_to_sig.get(isin)
        if sig:
            titre = _get_or_create(isin, sig)
        else:
            if isin not in titres:
                titres[isin] = {
                    'isin': isin,
                    'nom': isin,
                    'signaletique_id': None,
                    'devise_ref': 'EUR',
                    'historique': [],
                }
            titre = titres[isin]
        devise_ref = titre['devise_ref']
        for idx, entry in enumerate(entries):
            devise = str(entry.get('devise') or 'EUR').strip()
            if devise == '%':
                devise = devise_ref
            titre['historique'].append({
                'id': f"{isin}_{entry.get('date_import', '')}_{idx}_bonobo",
                'date': entry.get('date_import', ''),
                'cours': entry.get('cours'),
                'devise': devise,
                'source': 'bonobo',
            })

    # Tri par date puis dédoublonnage : un seul prix par date (le dernier source gagne — Bonobo > Koala)
    for isin in titres:
        titres[isin]['historique'].sort(key=lambda x: x.get('date') or '')
        par_date: Dict = {}
        for entry in titres[isin]['historique']:
            par_date[entry.get('date') or ''] = entry  # écrase si même date → dernier gagne
        titres[isin]['historique'] = list(par_date.values())

    _write_json_file(PRIX_HISTORIQUE_TITRES_FILE, titres)
    return {
        'titres_consolides': len(titres),
        'total_entrees': sum(len(t['historique']) for t in titres.values()),
        'koala_matches': sum(
            1 for t in titres.values()
            if any(e['source'] == 'koala' for e in t['historique'])
        ),
        'bonobo_matches': sum(
            1 for t in titres.values()
            if any(e['source'] == 'bonobo' for e in t['historique'])
        ),
    }


class DateTimeEncoder(json.JSONEncoder):
    """Encoder JSON personnalisé pour gérer les types date, datetime et Decimal"""
    
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)


def ensure_data_dir():
    """Crée le répertoire de données s'il n'existe pas"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)


def _read_json_file(filepath: str, default: Any = None) -> Any:
    """Lit un fichier JSON et retourne son contenu"""
    if not os.path.exists(filepath):
        return default if default is not None else []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default if default is not None else []


def _write_json_file(filepath: str, data: Any):
    """Écrit des données dans un fichier JSON"""
    ensure_data_dir()
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, cls=DateTimeEncoder, ensure_ascii=False)


def _get_next_id(items: List[Dict]) -> int:
    """Retourne le prochain ID disponible"""
    if not items:
        return 1
    return max(item.get('id', 0) for item in items) + 1


# ============================================================================
# PORTFOLIOS
# ============================================================================

def get_all_portfolios() -> List[Dict]:
    """Récupère tous les portefeuilles"""
    return _read_json_file(PORTFOLIOS_FILE, [])


def get_portfolio_by_id(portfolio_id: int) -> Optional[Dict]:
    """Récupère un portefeuille par son ID"""
    portfolios = get_all_portfolios()
    for portfolio in portfolios:
        if portfolio.get('id') == portfolio_id:
            return portfolio
    return None


def get_portfolio_by_name(name: str) -> Optional[Dict]:
    """Récupère un portefeuille par son nom"""
    portfolios = get_all_portfolios()
    for portfolio in portfolios:
        if portfolio.get('name') == name:
            return portfolio
    return None


def create_portfolio(name: str, description: str = None,
                     type_compte: str = None, courtier: str = None,
                     devise: str = 'EUR', date_ouverture: str = None,
                     couleur: str = None) -> Dict:
    """Crée un nouveau portefeuille réel.

    Champs disponibles :
      name           – nom unique (obligatoire)
      description    – description libre
      type_compte    – ex. PEA, CTO, Assurance-vie, PER, Autre
      courtier       – ex. Boursorama, Degiro, Saxo …
      devise         – devise de référence (défaut EUR)
      date_ouverture – date ISO d'ouverture du compte
      couleur        – couleur d'affichage en hex (#RRGGBB)
    """
    portfolios = get_all_portfolios()

    if any(p.get('name') == name for p in portfolios):
        raise ValueError(f"Un portefeuille avec le nom '{name}' existe déjà")

    new_portfolio = {
        'id': _get_next_id(portfolios),
        'name': name,
        'description': description,
        'type_compte': type_compte,
        'courtier': courtier,
        'devise': devise or 'EUR',
        'date_ouverture': date_ouverture,
        'couleur': couleur,
        'date_creation': datetime.now().isoformat(),
        'date_modification': datetime.now().isoformat(),
    }

    portfolios.append(new_portfolio)
    _write_json_file(PORTFOLIOS_FILE, portfolios)
    return new_portfolio


def update_portfolio(portfolio_id: int, data: Dict) -> Optional[Dict]:
    """Met à jour un portefeuille"""
    portfolios = get_all_portfolios()
    
    for i, portfolio in enumerate(portfolios):
        if portfolio.get('id') == portfolio_id:
            # Vérifier unicité du nom si modifié
            new_name = data.get('name')
            if new_name and new_name != portfolio.get('name'):
                if any(p.get('name') == new_name and p.get('id') != portfolio_id for p in portfolios):
                    raise ValueError(f"Un portefeuille avec le nom '{new_name}' existe déjà")
            
            portfolio.update(data)
            portfolio['date_modification'] = datetime.now().isoformat()
            portfolios[i] = portfolio
            _write_json_file(PORTFOLIOS_FILE, portfolios)
            return portfolio
    
    return None


def delete_portfolio(portfolio_id: int) -> bool:
    """Supprime un portefeuille et toutes ses transactions et cash associés"""
    portfolios = get_all_portfolios()
    
    # Trouver et supprimer le portefeuille
    new_portfolios = [p for p in portfolios if p.get('id') != portfolio_id]
    
    if len(new_portfolios) == len(portfolios):
        return False  # Portefeuille non trouvé
    
    _write_json_file(PORTFOLIOS_FILE, new_portfolios)
    
    # Supprimer les transactions associées
    transactions = get_all_transactions()
    new_transactions = [t for t in transactions if t.get('portfolio_id') != portfolio_id]
    _write_json_file(TRANSACTIONS_FILE, new_transactions)
    
    # Supprimer les cash associés
    cash_entries = get_all_cash()
    new_cash = [c for c in cash_entries if c.get('portfolio_id') != portfolio_id]
    _write_json_file(CASH_FILE, new_cash)
    
    return True


def get_or_create_portfolio(name: str, defaults: Dict = None) -> tuple[Dict, bool]:
    """Récupère ou crée un portefeuille.

    defaults peut contenir n'importe quel champ de create_portfolio :
      description, type_compte, courtier, devise, date_ouverture, couleur.
    Utilisé lors des imports/restaurations pour propager les métadonnées
    même quand le portefeuille est créé à la volée.
    """
    portfolio = get_portfolio_by_name(name)
    if portfolio:
        return portfolio, False

    d = defaults or {}
    new_portfolio = create_portfolio(
        name=name,
        description=d.get('description'),
        type_compte=d.get('type_compte'),
        courtier=d.get('courtier'),
        devise=d.get('devise', 'EUR'),
        date_ouverture=d.get('date_ouverture'),
        couleur=d.get('couleur'),
    )
    return new_portfolio, True


# ============================================================================
# TRANSACTIONS
# ============================================================================

def get_all_transactions() -> List[Dict]:
    """Récupère toutes les transactions"""
    return _read_json_file(TRANSACTIONS_FILE, [])


def get_transaction_by_id(transaction_id: int) -> Optional[Dict]:
    """Récupère une transaction par son ID"""
    transactions = get_all_transactions()
    for transaction in transactions:
        if transaction.get('id') == transaction_id:
            return transaction
    return None


def get_transactions_by_portfolio(portfolio_id: int) -> List[Dict]:
    """Récupère toutes les transactions d'un portefeuille"""
    transactions = get_all_transactions()
    return [t for t in transactions if t.get('portfolio_id') == portfolio_id]


def transaction_exists(portfolio_id: int, signaletique_id: int, date_str: str,
                       type_operation: str, quantite: str, prix_unitaire: str,
                       isin: Optional[str] = None) -> bool:
    """Vérifie si une transaction existe déjà (détection de doublons).
    Utilise l'ISIN en priorité (stable après recréation du volume PostgreSQL),
    avec fallback sur signaletique_id pour les anciens enregistrements.
    """
    transactions = get_all_transactions()

    for transaction in transactions:
        if not (transaction.get('portfolio_id') == portfolio_id and
                transaction.get('date') == date_str and
                transaction.get('type_operation') == type_operation and
                str(transaction.get('quantite')) == str(quantite) and
                str(transaction.get('prix_unitaire')) == str(prix_unitaire)):
            continue
        # Vérifier l'identité du titre : ISIN en priorité, sinon signaletique_id
        stored_isin = transaction.get('isin')
        if isin and stored_isin:
            if stored_isin.upper() == isin.upper():
                return True
        elif transaction.get('signaletique_id') == signaletique_id:
            return True

    return False


def create_transaction(portfolio_id: int, signaletique_id: int, date_obj: date,
                       type_operation: str, quantite: Decimal, prix_unitaire: Decimal,
                       devise: str = 'EUR', isin: Optional[str] = None) -> Dict:
    """Crée une nouvelle transaction.
    isin est stocké en clair pour garantir la cohérence après recréation du volume PostgreSQL.
    """
    transactions = get_all_transactions()

    new_transaction = {
        'id': _get_next_id(transactions),
        'portfolio_id': portfolio_id,
        'signaletique_id': signaletique_id,
        'isin': isin.strip().upper() if isin else None,
        'date': date_obj.isoformat() if hasattr(date_obj, 'isoformat') else date_obj,
        'type_operation': type_operation,
        'quantite': str(quantite),
        'prix_unitaire': str(prix_unitaire),
        'devise': devise,
        'date_creation': datetime.now().isoformat()
    }

    transactions.append(new_transaction)
    _write_json_file(TRANSACTIONS_FILE, transactions)

    return new_transaction


def get_signaletique_for_transaction(transaction: Dict) -> Optional[Dict]:
    """Résout la signalétique d'une transaction.
    Essaie d'abord par signaletique_id, puis par ISIN en fallback.
    Permet de restaurer la cohérence après une recréation du volume PostgreSQL.
    """
    sig = get_signaletique_by_id(transaction.get('signaletique_id'))
    if sig:
        return sig
    isin = transaction.get('isin')
    if isin:
        return get_signaletique_by_isin(isin)
    return None


def delete_transaction(transaction_id: int) -> bool:
    """Supprime une transaction"""
    transactions = get_all_transactions()
    
    new_transactions = [t for t in transactions if t.get('id') != transaction_id]
    
    if len(new_transactions) == len(transactions):
        return False  # Transaction non trouvée
    
    _write_json_file(TRANSACTIONS_FILE, new_transactions)
    return True


# ============================================================================
# CASH
# ============================================================================

def get_all_cash() -> List[Dict]:
    """Récupère toutes les entrées de cash"""
    return _read_json_file(CASH_FILE, [])


def get_cash_by_id(cash_id: int) -> Optional[Dict]:
    """Récupère une entrée de cash par son ID"""
    cash_entries = get_all_cash()
    for cash in cash_entries:
        if cash.get('id') == cash_id:
            return cash
    return None


def get_cash_by_portfolio(portfolio_id: int) -> List[Dict]:
    """Récupère toutes les entrées de cash d'un portefeuille"""
    cash_entries = get_all_cash()
    return [c for c in cash_entries if c.get('portfolio_id') == portfolio_id]


def create_cash(portfolio_id: int, banque: str, montant: Decimal, 
                devise: str, date_obj: date, commentaire: str = None) -> Dict:
    """Crée une nouvelle entrée de cash"""
    cash_entries = get_all_cash()
    
    new_cash = {
        'id': _get_next_id(cash_entries),
        'portfolio_id': portfolio_id,
        'banque': banque,
        'montant': str(montant),
        'devise': devise,
        'date': date_obj.isoformat() if hasattr(date_obj, 'isoformat') else date_obj,
        'commentaire': commentaire,
        'date_creation': datetime.now().isoformat(),
        'date_modification': datetime.now().isoformat()
    }
    
    cash_entries.append(new_cash)
    _write_json_file(CASH_FILE, cash_entries)
    
    return new_cash


def update_cash(cash_id: int, data: Dict) -> Optional[Dict]:
    """Met à jour une entrée de cash"""
    cash_entries = get_all_cash()
    
    for i, cash in enumerate(cash_entries):
        if cash.get('id') == cash_id:
            cash.update(data)
            cash['date_modification'] = datetime.now().isoformat()
            cash_entries[i] = cash
            _write_json_file(CASH_FILE, cash_entries)
            return cash
    
    return None


def delete_cash(cash_id: int) -> bool:
    """Supprime une entrée de cash"""
    cash_entries = get_all_cash()
    
    new_cash = [c for c in cash_entries if c.get('id') != cash_id]
    
    if len(new_cash) == len(cash_entries):
        return False  # Cash non trouvé
    
    _write_json_file(CASH_FILE, new_cash)
    return True


# ============================================================================
# SIGNALETIQUE
# ============================================================================

def get_all_signaletiques() -> List[Dict]:
    return _read_json_file(SIGNALETIQUE_FILE, [])


def get_signaletique_by_id(sig_id: int) -> Optional[Dict]:
    for sig in get_all_signaletiques():
        if sig.get('id') == sig_id:
            return sig
    return None


def get_signaletique_by_isin(isin: str) -> Optional[Dict]:
    isin_upper = isin.strip().upper()
    for sig in get_all_signaletiques():
        if (sig.get('isin') or '').upper() == isin_upper:
            return sig
    return None


def get_signaletique_by_code(code: str) -> Optional[Dict]:
    code_upper = code.strip().upper()
    for sig in get_all_signaletiques():
        if (sig.get('code') or '').upper() == code_upper:
            return sig
    return None


def search_signaletique_by_titre(titre: str) -> Optional[Dict]:
    titre_lower = titre.strip().lower()
    for sig in get_all_signaletiques():
        if titre_lower in (sig.get('titre') or '').lower():
            return sig
    return None


def upsert_signaletique(code: str, isin: Optional[str], titre: str,
                        description: Optional[str] = None,
                        categorie_text: Optional[str] = None,
                        statut: Optional[str] = None,
                        donnees_supplementaires: Optional[Dict] = None) -> Dict:
    """Crée ou met à jour une signalétique dans le fichier JSON.
    La clé de déduplication est l'ISIN (si présent) puis le code.
    Retourne le dict signaletique (avec son id).
    """
    sigs = get_all_signaletiques()

    # Trouver un existant
    existing_idx = None
    if isin:
        isin_up = isin.strip().upper()
        for i, s in enumerate(sigs):
            if (s.get('isin') or '').upper() == isin_up:
                existing_idx = i
                break
    if existing_idx is None:
        code_up = code.strip().upper()
        for i, s in enumerate(sigs):
            if (s.get('code') or '').upper() == code_up:
                existing_idx = i
                break

    now = datetime.now().isoformat()

    if existing_idx is not None:
        sig = sigs[existing_idx]
        sig['code'] = code
        sig['isin'] = isin
        sig['titre'] = titre
        sig['description'] = description
        sig['categorie_text'] = categorie_text
        sig['statut'] = statut
        sig['donnees_supplementaires'] = donnees_supplementaires
        sig['date_modification'] = now
        sigs[existing_idx] = sig
    else:
        sig = {
            'id': _get_next_id(sigs),
            'code': code,
            'isin': isin,
            'titre': titre,
            'description': description,
            'categorie_text': categorie_text,
            'statut': statut,
            'donnees_supplementaires': donnees_supplementaires,
            'date_creation': now,
            'date_modification': now,
        }
        sigs.append(sig)

    _write_json_file(SIGNALETIQUE_FILE, sigs)
    return sig


def update_signaletique(sig_id: int, data: Dict) -> Optional[Dict]:
    """Met à jour une signalétique existante."""
    sigs = get_all_signaletiques()
    for i, sig in enumerate(sigs):
        if sig.get('id') == sig_id:
            sig.update(data)
            sig['date_modification'] = datetime.now().isoformat()
            sigs[i] = sig
            _write_json_file(SIGNALETIQUE_FILE, sigs)
            return sig
    return None


# ============================================================================
# TARGET PORTFOLIOS
# ============================================================================

def get_all_target_portfolios() -> List[Dict]:
    """Récupère tous les portefeuilles cibles"""
    return _read_json_file(TARGET_PORTFOLIOS_FILE, [])


def get_target_portfolio_by_id(portfolio_id: int) -> Optional[Dict]:
    """Récupère un portefeuille cible par son ID"""
    for portfolio in get_all_target_portfolios():
        if portfolio.get('id') == portfolio_id:
            return portfolio
    return None


def get_target_portfolio_by_name(name: str) -> Optional[Dict]:
    """Récupère un portefeuille cible par son nom"""
    for portfolio in get_all_target_portfolios():
        if portfolio.get('name') == name:
            return portfolio
    return None


def _validate_target_items(items: List[Dict]):
    """Valide les lignes d'un portefeuille cible. Lève ValueError si invalide."""
    if not items:
        raise ValueError("Au moins une ligne est requise")
    total = sum(float(item.get('ratio', 0)) for item in items)
    if abs(total - 100) > 0.01:
        raise ValueError(f"Le total des ratios doit être égal à 100% (actuellement {total:.2f}%)")
    sig_ids = [item.get('signaletique') for item in items]
    if len(set(sig_ids)) != len(sig_ids):
        raise ValueError("Chaque titre doit être unique")
    for item in items:
        if float(item.get('ratio', 0)) <= 0:
            raise ValueError("Chaque ratio doit être positif")


def create_target_portfolio(name: str, items: List[Dict]) -> Dict:
    """Crée un nouveau portefeuille cible.
    items: liste de dict {signaletique: int, ratio: float}
    """
    portfolios = get_all_target_portfolios()
    if any(p.get('name') == name for p in portfolios):
        raise ValueError(f"Un portefeuille cible nommé '{name}' existe déjà")
    _validate_target_items(items)
    portfolio_id = _get_next_id(portfolios)
    # Attribuer des IDs aux items
    normalized_items = [
        {'id': idx + 1, 'signaletique': int(item['signaletique']), 'ratio': str(round(float(item['ratio']), 4))}
        for idx, item in enumerate(items)
    ]
    new_portfolio = {
        'id': portfolio_id,
        'name': name,
        'date_creation': datetime.now().isoformat(),
        'date_modification': datetime.now().isoformat(),
        'items': normalized_items
    }
    portfolios.append(new_portfolio)
    _write_json_file(TARGET_PORTFOLIOS_FILE, portfolios)
    return new_portfolio


def update_target_portfolio(portfolio_id: int, name: str = None, items: List[Dict] = None) -> Optional[Dict]:
    """Met à jour un portefeuille cible."""
    portfolios = get_all_target_portfolios()
    for i, portfolio in enumerate(portfolios):
        if portfolio.get('id') == portfolio_id:
            if name is not None:
                if name != portfolio.get('name') and any(p.get('name') == name for p in portfolios if p.get('id') != portfolio_id):
                    raise ValueError(f"Un portefeuille cible nommé '{name}' existe déjà")
                portfolio['name'] = name
            if items is not None:
                _validate_target_items(items)
                portfolio['items'] = [
                    {'id': idx + 1, 'signaletique': int(item['signaletique']), 'ratio': str(round(float(item['ratio']), 4))}
                    for idx, item in enumerate(items)
                ]
            portfolio['date_modification'] = datetime.now().isoformat()
            portfolios[i] = portfolio
            _write_json_file(TARGET_PORTFOLIOS_FILE, portfolios)
            return portfolio
    return None


def delete_target_portfolio(portfolio_id: int) -> bool:
    """Supprime un portefeuille cible."""
    portfolios = get_all_target_portfolios()
    new_portfolios = [p for p in portfolios if p.get('id') != portfolio_id]
    if len(new_portfolios) == len(portfolios):
        return False
    _write_json_file(TARGET_PORTFOLIOS_FILE, new_portfolios)
    return True


# ============================================================================
# UTILITAIRES
# ============================================================================

def clear_all_data():
    """Supprime toutes les données (tous les fichiers JSON)"""
    if os.path.exists(DATA_DIR):
        for filename in [PORTFOLIOS_FILE, TRANSACTIONS_FILE, CASH_FILE, TARGET_PORTFOLIOS_FILE, SIGNALETIQUE_FILE]:
            if os.path.exists(filename):
                os.remove(filename)


def data_exists() -> bool:
    """Vérifie si le répertoire de données existe"""
    return os.path.exists(DATA_DIR)


def get_data_stats() -> Dict:
    """Retourne des statistiques sur les données"""
    if not data_exists():
        return {
            'data_dir_exists': False,
            'portfolios_count': 0,
            'transactions_count': 0,
            'cash_count': 0
        }
    
    return {
        'data_dir_exists': True,
        'portfolios_count': len(get_all_portfolios()),
        'transactions_count': len(get_all_transactions()),
        'cash_count': len(get_all_cash()),
        'target_portfolios_count': len(get_all_target_portfolios()),
        'signaletique_count': len(get_all_signaletiques())
    }
