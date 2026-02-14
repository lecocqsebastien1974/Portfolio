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
        setMessage(`✅ Import réussi !\n📊 ${data.details.succes} transaction(s) importée(s)${data.details.erreurs > 0 ? `\n⚠️ ${data.details.erreurs} erreur(s)` : ''}`);
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

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        
        <h1>💼 Portefeuilles Réels</h1>
        <p>Gérez vos transactions d'achat et de vente</p>
        
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
                  <p>{portfolio.description}</p>
                  <div className="portfolio-stats">
                    <span className="stat">
                      📊 {portfolio.transactions?.length || 0} transaction(s)
                    </span>
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => window.location.href = `/portfolios/${portfolio.id}`}
                  >
                    Voir détails
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default Portfolios;
