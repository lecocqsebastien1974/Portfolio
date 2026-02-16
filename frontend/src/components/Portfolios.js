import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function Portfolios() {
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const apiBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/real-portfolios/`);
      const data = await response.json();
      setPortfolios(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleImport = async () => {
    if (!file) {
      setMessage('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    setImporting(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiBaseUrl}/api/import/transactions/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        let message = `✅ Import réussi !\n📊 ${data.details.succes} transaction(s) importée(s)`;
        
        if (data.details.doublons > 0) {
          message += `\n⏭️ ${data.details.doublons} doublon(s) ignoré(s) (transactions déjà importées)`;
        }
        
        if (data.details.erreurs > 0) {
          message += `\n⚠️ ${data.details.erreurs} erreur(s)`;
        }
        
        // Gérer les ISINs inconnus
        if (data.isins_inconnus && data.isins_inconnus.count > 0) {
          message += `\n\n⚠️ ${data.isins_inconnus.count} ISIN(s) inconnu(s) du système portfolio`;
          message += '\n📥 Un fichier de signalétique a été préparé pour vous.';
          
          // Créer un lien de téléchargement
          if (data.isins_inconnus.csv_file_url) {
            const downloadUrl = `${apiBaseUrl}${data.isins_inconnus.csv_file_url}`;
            message += `\n\n👉 Cliquez ici pour télécharger : `;
            
            // Afficher le message avec un lien cliquable
            setMessage(
              <div>
                {message.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                <a 
                  href={downloadUrl} 
                  download 
                  className="btn btn-info"
                  style={{marginTop: '10px'}}
                >
                  📥 Télécharger le fichier de signalétique
                </a>
              </div>
            );
            
            setFile(null);
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';
            fetchPortfolios();
            return;
          }
        }
        
        setMessage(message);
        setFile(null);
        
        // Réinitialiser l'input file
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        
        // Rafraîchir la liste
        fetchPortfolios();
      } else {
        setMessage(`❌ ${data.error || 'Erreur lors de l\'import'}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId, portfolioName) => {
    const confirmation = window.confirm(`Vous allez supprimer un portefeuille. En êtes-vous certain?`);
    
    if (!confirmation) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/real-portfolios/${portfolioId}/`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setMessage(`✅ Portefeuille "${portfolioName}" supprimé avec succès`);
        // Rafraîchir la liste
        fetchPortfolios();
      } else {
        setMessage(`❌ Erreur lors de la suppression`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        
        <h1>💼 Mes portefeuilles</h1>
        <p>Gérez vos transactions d'achat et de vente</p>
        
        <div className="portfolios-list">
          <h2>📋 Mes Portefeuilles</h2>
          
          {loading ? (
            <p>Chargement...</p>
          ) : portfolios.length === 0 ? (
            <p>Aucun portefeuille. Importez des transactions pour commencer.</p>
          ) : (
            <div className="portfolio-cards">
              {portfolios.map(portfolio => (
                <div key={portfolio.id} className="portfolio-card">
                  <h3>{portfolio.name}</h3>
                  <div className="portfolio-stats">
                    <span className="stat">
                      📊 {portfolio.transactions?.length || 0} transaction(s)
                    </span>
                  </div>
                  <div className="portfolio-actions-vertical">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => window.location.href = `/portfolios/${portfolio.id}`}
                    >
                      Voir détails
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="import-container">
          <h2>📥 Importer des transactions</h2>
          <p>Format attendu : Date, Type, Isin, quantité, prix unitaire, Devise, Portefeuille</p>
          
          <div className="file-input-wrapper">
            <input 
              type="file" 
              id="file-upload"
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              disabled={importing}
            />
            <label htmlFor="file-upload" className="file-input-label">
              {file ? `📄 ${file.name}` : `📁 ${t('common.chooseFile')}`}
            </label>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? `⏳ ${t('common.importing')}` : `📤 ${t('common.import')}`}
          </button>
          
          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default Portfolios;
