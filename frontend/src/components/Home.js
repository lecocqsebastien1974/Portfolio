import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

function Home() {
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearMessage, setClearMessage] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupMessage(null);
    try {
      const apiBase = window.location.origin.replace(':3001', ':8001');
      const res = await fetch(`${apiBase}/api/backup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const stats = data.stats;
        setBackupMessage({
          type: 'success',
          text: `✅ Sauvegarde du ${data.date} créée dans Sauvegarde/ — `
              + `${stats.cash} cash, ${stats.transactions} transactions, `
              + `${stats.portefeuilles_cibles} port. cibles, ${stats.signaletiques} signalétiques`,
          files: data.fichiers,
        });
      } else {
        setBackupMessage({ type: 'error', text: `❌ Erreur: ${data.error || 'inconnue'}` });
      }
    } catch (e) {
      setBackupMessage({ type: 'error', text: `❌ Erreur réseau: ${e.message}` });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoreLoading(true);
    setRestoreMessage(null);
    try {
      const apiBase = window.location.origin.replace(':3001', ':8001');
      const res = await fetch(`${apiBase}/api/restore/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const d = data.details;
        const lines = [
          d.signaletique && !d.signaletique.error
            ? `Signalétique : ${d.signaletique.succes} importées (${d.signaletique.fichier})`
            : `Signalétique : ${d.signaletique?.error || 'erreur'}`,
          d.transactions && !d.transactions.error
            ? `Transactions : ${d.transactions.succes} importées, ${d.transactions.doublons} doublons (${d.transactions.fichier})`
            : `Transactions : ${d.transactions?.error || 'erreur'}`,
          d.cash && !d.cash.error
            ? `Cash : ${d.cash.succes} importées (${d.cash.fichier})`
            : `Cash : ${d.cash?.error || 'erreur'}`,
          d.portefeuilles_cibles && !d.portefeuilles_cibles.error
            ? `Portefeuilles cibles : ${d.portefeuilles_cibles.succes} importés (${d.portefeuilles_cibles.fichier})`
            : `Portefeuilles cibles : ${d.portefeuilles_cibles?.error || 'erreur'}`,
          d.utilisateurs && !d.utilisateurs.error
            ? `Utilisateurs : ${d.utilisateurs.crees} créés, ${d.utilisateurs.mis_a_jour} mis à jour (${d.utilisateurs.fichier})`
            : `Utilisateurs : ${d.utilisateurs?.error || 'erreur'}`,
        ];
        setRestoreMessage({ type: 'success', lines });
      } else {
        setRestoreMessage({ type: 'error', lines: [`❌ Erreur: ${data.error || 'inconnue'}`] });
      }
    } catch (e) {
      setRestoreMessage({ type: 'error', lines: [`❌ Erreur réseau: ${e.message}`] });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(
      '⚠️ Supprimer TOUS les fichiers JSON (data/) et Excel (Sauvegarde/) ?\n\nCette opération est irréversible. Assurez-vous d\'avoir fait une sauvegarde.'
    )) return;
    setClearLoading(true);
    setClearMessage(null);
    try {
      const apiBase = window.location.origin.replace(':3001', ':8001');
      const res = await fetch(`${apiBase}/api/clear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClearMessage({
          type: 'success',
          text: `✅ ${data.total} fichier(s) supprimé(s)`,
          files: data.supprime,
        });
      } else {
        setClearMessage({ type: 'error', text: `❌ Erreur: ${data.error || 'inconnue'}` });
      }
    } catch (e) {
      setClearMessage({ type: 'error', text: `❌ Erreur réseau: ${e.message}` });
    } finally {
      setClearLoading(false);
    }
  };


  return (
    <div className="App">
      <div className="language-selector">
        <button 
          className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
          onClick={() => changeLanguage('fr')}
        >
          🇫🇷 FR
        </button>
        <button 
          className={`lang-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => changeLanguage('en')}
        >
          🇬🇧 EN
        </button>
        <button 
          className="lang-btn logout-btn"
          onClick={handleLogout}
          title={user ? `${user.username}` : ''}
        >
          🚪 {t('login.logout')}
        </button>
      </div>
      <header className="App-header">
        <h1>{t('home.title')}</h1>
        <p>{t('common.welcome')}</p>
        
        <div className="button-container home-buttons">
          <Link to="/signaletique" className="btn btn-primary">
            {t('home.adminButton')}
          </Link>
          <Link to="/simulation" className="btn btn-home-simulation">
            {t('home.simulationButton')}
          </Link>
          <Link to="/portfolios" className="btn btn-home-portfolios">
            {t('home.portfoliosButton')}
          </Link>
          <Link to="/portfolio-analysis" className="btn btn-home-analysis">
            {t('home.analysisButton')}
          </Link>
        </div>

        {user && user.is_superuser && (
          <div style={{ marginTop: '30px' }}>
            <Link to="/admin-panel" className="btn" style={{ backgroundColor: '#e74c3c', color: 'white' }}>
              🔧 Panneau d'Administration
            </Link>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user && user.is_superuser && (
              <button
                onClick={handleRestore}
                disabled={restoreLoading}
                className="btn"
                style={{ backgroundColor: '#2980b9', color: 'white', opacity: restoreLoading ? 0.7 : 1, cursor: restoreLoading ? 'wait' : 'pointer' }}
              >
                {restoreLoading ? '⏳ Restauration en cours...' : '♻️ Restaurer depuis Sauvegarde'}
              </button>
            )}
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="btn"
              style={{ backgroundColor: '#27ae60', color: 'white', opacity: backupLoading ? 0.7 : 1, cursor: backupLoading ? 'wait' : 'pointer' }}
            >
              {backupLoading ? '⏳ Sauvegarde en cours...' : '💾 Sauvegarde des données'}
            </button>
            {user && user.is_superuser && (
              <button
                onClick={handleClear}
                disabled={clearLoading}
                className="btn"
                style={{ backgroundColor: '#c0392b', color: 'white', opacity: clearLoading ? 0.7 : 1, cursor: clearLoading ? 'wait' : 'pointer' }}
              >
                {clearLoading ? '⏳ Suppression en cours...' : '🗑️ Supprimer toutes les données'}
              </button>
            )}
          </div>
          {backupMessage && (
            <div style={{
              marginTop: '12px',
              padding: '12px 18px',
              borderRadius: '6px',
              backgroundColor: backupMessage.type === 'success' ? '#eafaf1' : '#fdf2f2',
              color: backupMessage.type === 'success' ? '#1e8449' : '#c0392b',
              border: `1px solid ${backupMessage.type === 'success' ? '#a9dfbf' : '#f5b7b1'}`,
              maxWidth: '600px',
              margin: '12px auto 0',
              fontSize: '0.9em',
              textAlign: 'left',
            }}>
              <div>{backupMessage.text}</div>
              {backupMessage.files && (
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {backupMessage.files.map(f => <li key={f}>{f}</li>)}
                </ul>
              )}
            </div>
          )}
          {restoreMessage && (
            <div style={{
              marginTop: '12px',
              padding: '12px 18px',
              borderRadius: '6px',
              backgroundColor: restoreMessage.type === 'success' ? '#eaf4fb' : '#fdf2f2',
              color: restoreMessage.type === 'success' ? '#1a5276' : '#c0392b',
              border: `1px solid ${restoreMessage.type === 'success' ? '#aed6f1' : '#f5b7b1'}`,
              maxWidth: '600px',
              margin: '12px auto 0',
              fontSize: '0.9em',
              textAlign: 'left',
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                {restoreMessage.type === 'success' ? '✅ Restauration terminée' : '❌ Erreur de restauration'}
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {restoreMessage.lines.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}
          {clearMessage && (
            <div style={{
              marginTop: '12px',
              padding: '12px 18px',
              borderRadius: '6px',
              backgroundColor: clearMessage.type === 'success' ? '#fef9e7' : '#fdf2f2',
              color: clearMessage.type === 'success' ? '#7d6608' : '#c0392b',
              border: `1px solid ${clearMessage.type === 'success' ? '#f9e79f' : '#f5b7b1'}`,
              maxWidth: '600px',
              margin: '12px auto 0',
              fontSize: '0.9em',
              textAlign: 'left',
            }}>
              <div>{clearMessage.text}</div>
              {clearMessage.files && clearMessage.files.length > 0 && (
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {clearMessage.files.map(f => <li key={f}>{f}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default Home;
