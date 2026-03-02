"""
Script pour récupérer les détails des erreurs d'import de signalétique
"""
import requests
import json

# Configuration
API_BASE_URL = "http://localhost:8000/api"

def get_import_logs():
    """Récupère les logs d'import"""
    try:
        response = requests.get(f"{API_BASE_URL}/import/logs/")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Erreur lors de la récupération des logs: {e}")
        return None

def display_errors(log):
    """Affiche les détails des erreurs d'un log"""
    print(f"\n{'='*80}")
    print(f"📄 Fichier: {log['nom_fichier']}")
    print(f"📅 Date: {log['date_import']}")
    print(f"📊 Résumé:")
    print(f"   • Lignes totales: {log['nombre_lignes']}")
    print(f"   • Succès: {log['nombre_succes']}")
    print(f"   • Erreurs: {log['nombre_erreurs']}")
    print(f"{'='*80}\n")
    
    if log.get('erreurs') and log['nombre_erreurs'] > 0:
        print(f"🔍 DÉTAILS DES {log['nombre_erreurs']} ERREURS:\n")
        for i, erreur in enumerate(log['erreurs'], 1):
            ligne = erreur.get('ligne', 'N/A')
            message = erreur.get('erreur', erreur.get('erreur_generale', 'Erreur inconnue'))
            print(f"  {i}. Ligne {ligne}: {message}")
    else:
        print("✅ Aucune erreur détectée")

def main():
    print("🔍 Récupération des logs d'import de signalétique...\n")
    
    logs = get_import_logs()
    if not logs:
        print("❌ Impossible de récupérer les logs")
        return
    
    # Filtrer les logs de signalétique contenant "Signalétique020326"
    matching_logs = [
        log for log in logs 
        if log['type_import'] == 'signaletique' 
        and 'Signalétique020326' in log['nom_fichier']
    ]
    
    if not matching_logs:
        print("❌ Aucun log trouvé pour le fichier 'Signalétique020326.xlsx'")
        print("\n📋 Derniers logs disponibles:")
        for log in logs[:5]:
            print(f"   • {log['nom_fichier']} ({log['date_import']}) - {log['nombre_erreurs']} erreur(s)")
        return
    
    # Afficher le log le plus récent
    latest_log = matching_logs[0]
    display_errors(latest_log)

if __name__ == "__main__":
    main()
