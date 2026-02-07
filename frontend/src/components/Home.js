import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function Home() {
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
        <h1>{t('home.title')}</h1>
        <p>{t('common.welcome')}</p>
        
        <div className="button-container">
          <Link to="/admin" className="btn btn-primary">
            {t('home.adminButton')}
          </Link>
        </div>
      </header>
    </div>
  );
}

export default Home;
