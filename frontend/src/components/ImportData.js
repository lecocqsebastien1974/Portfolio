import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function ImportData() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('signaletique');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleImport = async () => {
    if (!file) {
      setMessage(t('import.messages.selectFile'));
      return;
    }

    setImporting(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const response = await fetch(`${apiBaseUrl}/api/import/signaletique/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`✅ ${t('import.messages.success').replace('{fileName}', file.name)}\n📊 ${data.details.succes} ligne(s) importée(s) avec succès${data.details.erreurs > 0 ? `\n⚠️ ${data.details.erreurs} erreur(s)` : ''}`);
        setFile(null);
        
        // Réinitialiser l'input file
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(`❌ ${data.error || t('import.messages.error')}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'signaletique') {
      return (
        <div className="tab-content">
          <h2>{t('import.signaletique.title')}</h2>
          <p>{t('import.signaletique.description')}</p>
        </div>
      );
    } else if (activeTab === 'pricing') {
      return (
        <div className="tab-content">
          <h2>{t('import.pricing.title')}</h2>
          <p>{t('import.pricing.description')}</p>
        </div>
      );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/admin" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        
        <h1>{t('import.title')}</h1>
        <p>{t('import.subtitle')}</p>
        
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'signaletique' ? 'active' : ''}`}
            onClick={() => setActiveTab('signaletique')}
          >
            {t('import.tabs.signaletique')}
          </button>
          <button
            className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            {t('import.tabs.pricing')}
          </button>
        </div>

        {renderTabContent()}
        
        <div className="import-container">
          <div className="file-input-wrapper">
            <input 
              type="file" 
              id="file-upload"
              onChange={handleFileChange}
              accept=".csv,.json,.xlsx"
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
          
          <div className="info-box">
            <h3>{t('import.formats.title')}</h3>
            <ul>
              <li>{t('import.formats.csv')}</li>
              <li>{t('import.formats.json')}</li>
              <li>{t('import.formats.xlsx')}</li>
            </ul>
          </div>
        </div>
      </header>
    </div>
  );
}

export default ImportData;
