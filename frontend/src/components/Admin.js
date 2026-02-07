import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function Admin() {
  const { t, language, changeLanguage } = useLanguage();

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
      </div>
      <header className="App-header">
        <Link to="/" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.subtitle')}</p>
        
        <div className="button-container">
          <Link to="/admin/import" className="btn btn-primary">
            {t('admin.importData')}
          </Link>
          <Link to="/admin/signaletique" className="btn btn-success">
            📊 {t('admin.viewData')}
          </Link>
          <button className="btn btn-secondary">
            {t('admin.manageUsers')}
          </button>
        </div>
      </header>
    </div>
  );
}

export default Admin;
