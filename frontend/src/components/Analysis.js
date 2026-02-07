import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function Analysis() {
  const { t, language, changeLanguage } = useLanguage();
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [signaletiqueMap, setSignaletiqueMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

  const normalizeKey = useCallback((value) => {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }, []);

  const parseNumber = useCallback((value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const normalized = String(value)
      .replace('%', '')
      .replace(',', '.')
      .trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  const getValue = useCallback((ds, label) => {
    if (!ds) return 0;
    const keyMap = new Map(Object.keys(ds).map((key) => [normalizeKey(key), key]));
    const matchedKey = keyMap.get(normalizeKey(label));
    return parseNumber(matchedKey ? ds[matchedKey] : 0);
  }, [normalizeKey, parseNumber]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [portfolioResponse, signaletiqueResponse] = await Promise.all([
        fetch(`${API_URL}/api/target-portfolios/${id}/`),
        fetch(`${API_URL}/api/signaletique/`)
      ]);

      if (!portfolioResponse.ok) throw new Error(t('analysis.error'));
      if (!signaletiqueResponse.ok) throw new Error(t('analysis.error'));

      const portfolioData = await portfolioResponse.json();
      const signaletiqueData = await signaletiqueResponse.json();

      const map = new Map(
        (Array.isArray(signaletiqueData) ? signaletiqueData : []).map((item) => [
          String(item.id),
          item
        ])
      );

      setPortfolio(portfolioData);
      setSignaletiqueMap(map);
      setError('');
    } catch (err) {
      setError(err.message || t('analysis.error'));
    } finally {
      setLoading(false);
    }
  }, [API_URL, id, t]);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [fetchData, id]);

  const geoFields = useMemo(() => ([
    'USA',
    'Japon',
    'Grande Bretagne',
    'Canada',
    'Pays Emergeants Hors Chine et Japon',
    'Australie',
    'Suede',
    'Suisse',
    'Chine',
    'Israel',
    'Allemagne',
    'Nouvelle Zelande',
    'Pays-Bas',
    'Irlande',
    'Espagne',
    'Italie',
    'France',
    'Autre Pays'
  ]), []);

  const sectorFields = useMemo(() => ([
    'Etats',
    'Industrie',
    'Finance',
    'Consommation Cyclique',
    'Technologie',
    'Sante',
    'Consommation Defensive',
    'Communication',
    'Immobilier',
    'Matieres Premieres',
    'Energie',
    'Service Publiques',
    'Services de consommation',
    'Autre Secteur'
  ]), []);

  const rows = useMemo(() => {
    if (!portfolio || !portfolio.items) return [];
    return portfolio.items.map((item) => {
      const signaletique = signaletiqueMap.get(String(item.signaletique));
      const ds = signaletique?.donnees_supplementaires || {};
      const ratio = parseNumber(item.ratio);
      const name = signaletique?.donnees_supplementaires?.['Nom'] || signaletique?.titre || `#${item.signaletique}`;
      return {
        id: item.id || `${item.signaletique}`,
        name,
        ratio,
        ds
      };
    });
  }, [portfolio, signaletiqueMap, parseNumber]);

  const renderTable = (fields) => (
    <div className="analysis-frame">
      <table className="analysis-table">
        <thead>
          <tr>
            <th>{t('analysis.titleLabel')}</th>
            <th>{t('analysis.ratioLabel')}</th>
            {fields.map((field) => (
              <th key={field}>{field}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.ratio.toFixed(2)}%</td>
              {fields.map((field) => {
                const value = getValue(row.ds, field);
                const computed = row.ratio * value;
                return (
                  <td key={`${row.id}-${field}`}>{computed.toFixed(2)}%</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
        <Link to="/simulation" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        <h1>{t('analysis.title')}</h1>
        <p>{t('analysis.subtitle')}</p>
        {loading && (
          <div className="simulation-card">
            <p>{t('analysis.loading')}</p>
          </div>
        )}

        {!loading && error && (
          <div className="simulation-card">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && portfolio && (
          <div className="simulation-card analysis-card">
            <h2>{portfolio.name}</h2>
            {rows.length === 0 && <p>{t('analysis.empty')}</p>}
            {rows.length > 0 && (
              <>
                <h3>{t('analysis.geoTitle')}</h3>
                {renderTable(geoFields)}
                <h3>{t('analysis.sectorTitle')}</h3>
                {renderTable(sectorFields)}
              </>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default Analysis;
