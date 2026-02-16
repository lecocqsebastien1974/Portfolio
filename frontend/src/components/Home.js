import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

function Home() {
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        </div>

        {user && user.is_superuser && (
          <div style={{ marginTop: '30px' }}>
            <Link to="/admin-panel" className="btn" style={{ backgroundColor: '#e74c3c', color: 'white' }}>
              🔧 Panneau d'Administration
            </Link>
          </div>
        )}
      </header>
    </div>
  );
}

export default Home;
