import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function SignaletiqueList() {
  const { t, language, changeLanguage } = useLanguage();
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instrumentTypes, setInstrumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  // Import source Koala
  const [showKoalaPanel, setShowKoalaPanel] = useState(false);
  const [koalaFile, setKoalaFile] = useState(null);
  const [koalaImporting, setKoalaImporting] = useState(false);
  const [koalaMessage, setKoalaMessage] = useState('');
  const [koalaHistory, setKoalaHistory] = useState(null);
  const [showKoalaHistory, setShowKoalaHistory] = useState(false);

  // Import source Bonobo
  const [showBonoboPanel, setShowBonoboPanel] = useState(false);
  const [bonoboFile, setBonoboFile] = useState(null);
  const [bonoboImporting, setBonoboImporting] = useState(false);
  const [bonoboMessage, setBonoboMessage] = useState('');
  const [bonoboHistory, setBonoboHistory] = useState(null);
  const [showBonoboHistory, setShowBonoboHistory] = useState(false);

  // Historique consolidé des cours
  const [titreHistory, setTitreHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showTitreHistory, setShowTitreHistory] = useState(false);
  const [historyStatus, setHistoryStatus] = useState(null); // null | 'ok' | 'not_found' | 'error'
  const [consolidating, setConsolidating] = useState(false);
  const [consolidateMsg, setConsolidateMsg] = useState('');

  // Import tout-en-un depuis Start Files
  const [importingPrix, setImportingPrix] = useState(false);
  const [importPrixMsg, setImportPrixMsg] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    Nom: '',
    Isin: '',
    'Type d\'instr': '',
    'Classe d\'actifs': '',
    'categorie_id': null,
    'Cap/Dis': '',
    Devise: '',
    TER: '',
    ESG: '',
    Symbole: '',
    'Nom Long': '',
    Taux: '',
    Positions: '',
    'Date de fin': '',
    'Frequence Coupon': '',
    Replication: '',
    'Qualité credit': '',
    'Taille du Fonds': '',
    'Couverture de change': '',
    'Banque Emetteur': '',
    'Autre Emetteur': '',
    'Banques Dispo': '',
    // Prix / Cours
    prix: '',
    devise_prix: '',
    source_prix: '',
    date_cours: '',
    frequence_coupon: '',
    USA: '',
    Canada: '',
    France: '',
    Allemagne: '',
    'Grande Bretagne': '',
    Suisse: '',
    Espagne: '',
    Italie: '',
    'Pays-Bas': '',
    Suède: '',
    Irlande: '',
    Israel: '',
    Australie: '',
    'Nouvelle Zelande': '',
    Japon: '',
    Chine: '',
    'Pays Emergeants Hors Chine et Japon': '',
    'Autre Pays': '',
    Etats: '',
    Etats2: '',
    Finance: '',
    Technologie: '',
    Santé: '',
    Industrie: '',
    Energie: '',
    'Matières Premières': '',
    Immobilier: '',
    Communication: '',
    'Service Publiques': '',
    'Consommation Cyclique': '',
    'Consommation Defensive': '',
    'Services de consommation': '',
    Entreprises: '',
    'Autre Secteur': ''
  });

  const normalizeKey = (value) => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const getDisplayName = (item) => {
    const ds = item?.donnees_supplementaires || {};
    const keyMap = new Map(Object.keys(ds).map((key) => [normalizeKey(key), key]));
    const nameKey = keyMap.get(normalizeKey('Nom'));
    return (nameKey && ds[nameKey]) || item?.titre || '';
  };

  const investmentTypes = [...new Set(data.map(item => item.donnees_supplementaires?.['Type d\'instr']).filter(Boolean))];
  const assetClasses = [...new Set(data.map(item => item.donnees_supplementaires?.['Classe d\'actifs']).filter(Boolean))];

  const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchInstrumentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories/`);
      if (response.ok) {
        const categoriesData = await response.json();
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData.results || []);
        setCategories(categoriesList);
      } else {
        console.error('Erreur lors du chargement des catégories:', response.status);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const fetchInstrumentTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/instrument-types/`);
      if (response.ok) {
        const data = await response.json();
        setInstrumentTypes(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des types d\'instruments:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/signaletique/`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_URL}/api/signaletique/export/`);
      if (!response.ok) throw new Error('Erreur lors de l\'export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signaletique_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('✅ Export CSV réussi !');
    } catch (err) {
      alert(`❌ Erreur lors de l'export: ${err.message}`);
    }
  };

  const handleKoalaImport = async () => {
    if (!koalaFile) {
      setKoalaMessage('⚠️ Veuillez sélectionner un fichier .xlsx');
      return;
    }
    setKoalaImporting(true);
    setKoalaMessage('');
    try {
      const formData = new FormData();
      formData.append('file', koalaFile);
      const response = await fetch(`${API_URL}/api/import/koala/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur serveur');
      const ids = data.details?.identifiants || [];
      setKoalaMessage(
        `✅ ${data.details?.ajoutes ?? 0} cours importés (${ids.length} symboles) • date : ${data.details?.date_import}${
          data.details?.ignores ? ` • ${data.details.ignores} ignoré(s)` : ''
        }`
      );
      setKoalaFile(null);
      // Consolidation silencieuse
      fetch(`${API_URL}/api/prix-historique/consolidate/`, { method: 'POST' }).catch(() => {});
    } catch (err) {
      setKoalaMessage(`❌ ${err.message}`);
    } finally {
      setKoalaImporting(false);
    }
  };

  const handleViewKoalaHistory = async () => {
    if (showKoalaHistory) {
      setShowKoalaHistory(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/import/koala/history/`);
      const data = await response.json();
      setKoalaHistory(data);
      setShowKoalaHistory(true);
    } catch (err) {
      setKoalaMessage(`❌ Impossible de charger l'historique : ${err.message}`);
    }
  };

  const handleBonoboImport = async () => {
    if (!bonoboFile) {
      setBonoboMessage('⚠️ Veuillez sélectionner un fichier .csv');
      return;
    }
    setBonoboImporting(true);
    setBonoboMessage('');
    try {
      const formData = new FormData();
      formData.append('file', bonoboFile);
      const response = await fetch(`${API_URL}/api/import/bonobo/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur serveur');
      const ids = data.details?.identifiants || [];
      setBonoboMessage(
        `✅ ${data.details?.ajoutes ?? 0} cours importés (${ids.length} ISIN) • date : ${data.details?.date_import}${
          data.details?.ignores ? ` • ${data.details.ignores} ignoré(s)` : ''
        }`
      );
      setBonoboFile(null);
      // Consolidation silencieuse
      fetch(`${API_URL}/api/prix-historique/consolidate/`, { method: 'POST' }).catch(() => {});
    } catch (err) {
      setBonoboMessage(`❌ ${err.message}`);
    } finally {
      setBonoboImporting(false);
    }
  };

  const handleViewBonoboHistory = async () => {
    if (showBonoboHistory) {
      setShowBonoboHistory(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/import/bonobo/history/`);
      const data = await response.json();
      setBonoboHistory(data);
      setShowBonoboHistory(true);
    } catch (err) {
      setBonoboMessage(`❌ Impossible de charger l'historique : ${err.message}`);
    }
  };

  const handleImportPrix = async () => {
    setImportingPrix(true);
    setImportPrixMsg('');
    try {
      const response = await fetch(`${API_URL}/api/import/prix-startfiles/`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur serveur');
      const d = data.details || {};
      const k = d.koala || {};
      const b = d.bonobo || {};
      const c = d.consolidation || {};
      const kFile = k.fichier ? ` (${k.fichier})` : '';
      const bFile = b.fichier ? ` (${b.fichier})` : '';
      setImportPrixMsg(
        `✅ Koala${kFile} : ${k.ajoutes ?? '–'} cours ` +
        `• Bonobo${bFile} : ${b.ajoutes ?? '–'} cours ` +
        `• ${c.titres_consolides ?? 0} titres consolidés (${c.total_entrees ?? 0} entrées)`
      );
    } catch (err) {
      setImportPrixMsg(`❌ ${err.message}`);
    } finally {
      setImportingPrix(false);
    }
  };

  const handleConsolidatePrices = async () => {
    setConsolidating(true);
    setConsolidateMsg('');
    try {
      const response = await fetch(`${API_URL}/api/prix-historique/consolidate/`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur serveur');
      setConsolidateMsg(`✅ ${data.message}`);
    } catch (err) {
      setConsolidateMsg(`❌ ${err.message}`);
    } finally {
      setConsolidating(false);
    }
  };

  const handleViewTitreHistory = async (item) => {
    if (showTitreHistory && titreHistory?.isin === item.isin) {
      setShowTitreHistory(false);
      return;
    }
    if (!item.isin) {
      setShowTitreHistory(true);
      setTitreHistory(null);
      setHistoryStatus('not_found');
      return;
    }
    setLoadingHistory(true);
    setShowTitreHistory(false);
    setHistoryStatus(null);
    try {
      const response = await fetch(`${API_URL}/api/prix-historique/${encodeURIComponent(item.isin)}/`);
      if (response.status === 404) {
        setTitreHistory(null);
        setHistoryStatus('not_found');
      } else {
        const data = await response.json();
        setTitreHistory(data);
        setHistoryStatus('ok');
      }
      setShowTitreHistory(true);
    } catch (err) {
      setTitreHistory(null);
      setHistoryStatus('error');
      setShowTitreHistory(true);
    } finally {
      setLoadingHistory(false);
    }
  };


  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      code: '',
      Nom: '',
      Isin: '',
      'Type d\'instr': '',
      'Classe d\'actifs': '',
      'categorie_id': null,
      'Cap/Dis': '',
      Devise: '',
      TER: '',
      ESG: '',
      prix: '',
      devise_prix: '',
      source_prix: '',
      date_cours: '',
      frequence_coupon: '',
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    setModalMode('edit');
    const ds = selectedItem.donnees_supplementaires || {};
    
    // Charger l'ID de catégorie depuis le modèle (peut être null)
    const categorieId = selectedItem.categorie?.id || selectedItem.categorie || null;
    
    setFormData({
      code: selectedItem.code,
      Nom: ds['Nom'] || '',
      Isin: ds['Isin'] || '',
      'Type d\'instr': ds['Type d\'instr'] || '',
      'Classe d\'actifs': ds['Classe d\'actifs'] || '',
      'categorie_id': categorieId,
      'Cap/Dis': ds['Cap/Dis'] || '',
      Devise: ds['Devise'] || '',
      TER: ds['TER'] || '',
      ESG: ds['ESG'] || '',
      Symbole: ds['Symbole'] || '',
      'Nom Long': ds['Nom Long'] || '',
      Taux: ds['Taux'] || '',
      Positions: ds['Positions'] || '',
      'Date de fin': ds['Date de fin'] || '',
      'Frequence Coupon': ds['Frequence Coupon'] || '',
      Replication: ds['Replication'] || '',
      'Qualité credit': ds['Qualité credit'] || '',
      'Taille du Fonds': ds['Taille du Fonds'] || '',
      'Couverture de change': ds['Couverture de change'] || '',
      'Banque Emetteur': ds['Banque Emetteur'] || '',
      'Autre Emetteur': ds['Autre Emetteur'] || '',
      'Banques Dispo': ds['Banques Dispo'] || '',
      // Prix / Cours (champs top-level du modèle)
      prix: selectedItem.prix || '',
      devise_prix: selectedItem.devise_prix || '',
      source_prix: selectedItem.source_prix || '',
      date_cours: selectedItem.date_cours || '',
      frequence_coupon: selectedItem.frequence_coupon || '',
      USA: ds['USA'] || '',
      Canada: ds['Canada'] || '',
      France: ds['France'] || '',
      Allemagne: ds['Allemagne'] || '',
      'Grande Bretagne': ds['Grande Bretagne'] || '',
      Suisse: ds['Suisse'] || '',
      Espagne: ds['Espagne'] || '',
      Italie: ds['Italie'] || '',
      'Pays-Bas': ds['Pays-Bas'] || '',
      Suède: ds['Suède'] || '',
      Irlande: ds['Irlande'] || '',
      Israel: ds['Israel'] || '',
      Australie: ds['Australie'] || '',
      'Nouvelle Zelande': ds['Nouvelle Zelande'] || '',
      Japon: ds['Japon'] || '',
      Chine: ds['Chine'] || '',
      'Pays Emergeants Hors Chine et Japon': ds['Pays Emergeants Hors Chine et Japon'] || '',
      'Autre Pays': ds['Autre Pays'] || '',
      Etats: ds['Etats'] || '',
      Etats2: ds['Etats2'] || '',
      Finance: ds['Finance'] || '',
      Technologie: ds['Technologie'] || '',
      Santé: ds['Santé'] || '',
      Industrie: ds['Industrie'] || '',
      Energie: ds['Energie'] || '',
      'Matières Premières': ds['Matières Premières'] || '',
      Immobilier: ds['Immobilier'] || '',
      Communication: ds['Communication'] || '',
      'Service Publiques': ds['Service Publiques'] || '',
      'Consommation Cyclique': ds['Consommation Cyclique'] || '',
      'Consommation Defensive': ds['Consommation Defensive'] || '',
      'Services de consommation': ds['Services de consommation'] || '',
      Entreprises: ds['Entreprises'] || '',
      'Autre Secteur': ds['Autre Secteur'] || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Normaliser l'ISIN (strip et uppercase)
    const normalizedIsin = formData.Isin ? formData.Isin.trim().toUpperCase() : '';
    
    // Valider l'ISIN si fourni
    if (normalizedIsin && normalizedIsin.length !== 12) {
      alert("L'ISIN doit avoir exactement 12 caractères ou être vide");
      return;
    }
    
    try {
      const payload = {
        titre: formData.Nom,
        isin: normalizedIsin || null,
        categorie: formData.categorie_id || null,
        statut: formData['Type d\'instr'] || null,
        prix: formData.prix !== '' ? formData.prix : null,
        devise_prix: formData.devise_prix || null,
        source_prix: formData.source_prix || null,
        date_cours: formData.date_cours || null,
        frequence_coupon: formData.frequence_coupon || null,
        donnees_supplementaires: {
          ...formData,
          Isin: normalizedIsin
        }
      };
      
      // N'envoyer le code que s'il est fourni
      if (formData.code && formData.code.trim()) {
        payload.code = formData.code;
        payload.donnees_supplementaires.Code = formData.code;
      }

      const url = modalMode === 'edit' 
        ? `${API_URL}/api/signaletique/${selectedItem.id}/`
        : `${API_URL}/api/signaletique/`;
      
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Extraire le message d'erreur de l'API
        let errorMessage = 'Erreur lors de la sauvegarde';
        if (errorData.isin && Array.isArray(errorData.isin)) {
          errorMessage = errorData.isin[0];
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (modalMode === 'edit') {
        setData(data.map(item => item.id === selectedItem.id ? result : item));
        setSelectedItem(result);
      } else {
        setData([result, ...data]);
        setSelectedItem(result);
      }
      
      setShowModal(false);
      alert(modalMode === 'edit' ? 'Titre modifié avec succès' : 'Titre ajouté avec succès');
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const filteredData = data.filter(item => {
    const nomLong = getDisplayName(item);
    const typeInvest = item.donnees_supplementaires?.['Type d\'instr'] || '';
    const classeActif = item.donnees_supplementaires?.['Classe d\'actifs'] || '';
    
    const matchesSearch = nomLong.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || typeInvest === filterType;
    const matchesClass = !filterClass || classeActif === filterClass;
    
    return matchesSearch && matchesType && matchesClass;
  });

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
        <Link to="/signaletique" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        
        <h1>{t('signaletique.title')}</h1>
        <p>{t('signaletique.subtitle')}</p>



        <div className="filters-section">
          <div className="search-filter">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="advanced-filters">
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tous les types</option>
              {investmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select 
              className="filter-select"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {assetClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            
            <button className="btn btn-success" onClick={openAddModal}>
              ➕ Ajouter
            </button>
            
            <button className="btn btn-primary" onClick={fetchData}>
              🔄 Actualiser
            </button>
            
            <button className="btn btn-info" onClick={handleExportCSV}>
              💾 Exporter CSV
            </button>

            <button
              className="btn btn-koala"
              onClick={() => { setShowKoalaPanel(!showKoalaPanel); setKoalaMessage(''); }}
            >
              🐨 Import source Koala
            </button>

            <button
              className="btn btn-bonobo"
              onClick={() => { setShowBonoboPanel(!showBonoboPanel); setBonoboMessage(''); }}
            >
              🐒 Import source Bonobo
            </button>

            <button
              className="btn btn-consolidate"
              onClick={handleConsolidatePrices}
              disabled={consolidating}
              title="Associer Koala + Bonobo aux titres de la signalétique"
            >
              {consolidating ? '⏳ Consolidation…' : '🔗 Consolider les prix'}
            </button>

            <button
              className="btn btn-import-prix"
              onClick={handleImportPrix}
              disabled={importingPrix}
              title="Lire les fichiers Koala (.xlsx) et Bonobo (.csv) dans Start Files, puis consolider"
            >
              {importingPrix ? '⏳ Import en cours…' : '📥 Importer les prix'}
            </button>
          </div>
          {consolidateMsg && (
            <div className={`message ${consolidateMsg.startsWith('✅') ? 'success' : 'error'} consolidate-msg`}>
              {consolidateMsg}
            </div>
          )}
          {importPrixMsg && (
            <div className={`message ${importPrixMsg.startsWith('✅') ? 'success' : 'error'} consolidate-msg`}>
              {importPrixMsg}
            </div>
          )}
        </div>

        {/* ── Panneau Import source Koala ── */}
        {showKoalaPanel && (
          <div className="koala-panel">
            <h3>🐨 Import source Koala</h3>
            <p className="koala-desc">
              Importe uniquement les colonnes <strong>D (Symbole)</strong> et <strong>H (Cours)</strong>
              depuis un fichier Koala (.xlsx). Chaque import est horodaté et stocké dans l'historique
              de prix par symbole. Aucune donnée n'est écrite en base de données.
            </p>
            <div className="koala-form">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="form-input"
                onChange={(e) => setKoalaFile(e.target.files[0] || null)}
              />
              <button
                className="btn btn-primary"
                onClick={handleKoalaImport}
                disabled={koalaImporting || !koalaFile}
              >
                {koalaImporting ? '⏳ Import en cours…' : '📥 Importer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleViewKoalaHistory}
              >
                {showKoalaHistory ? '🙈 Masquer l\'historique' : '📜 Voir l\'historique'}
              </button>
            </div>
            {koalaMessage && (
              <div className={`message ${koalaMessage.startsWith('✅') ? 'success' : 'error'}`}>
                {koalaMessage}
              </div>
            )}
            {showKoalaHistory && koalaHistory && (
              <div className="koala-history">
                <h4>Historique des cours (par symbole)</h4>
                {Object.keys(koalaHistory).length === 0 ? (
                  <p>Aucun historique disponible.</p>
                ) : (
                  <table className="data-table koala-history-table">
                    <thead>
                      <tr>
                        <th>Symbole</th>
                        <th>Entrées</th>
                        <th>Dernier cours</th>
                        <th>Dernière date</th>
                        <th>Devise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(koalaHistory).sort().map(([sym, entries]) => {
                        const last = entries[entries.length - 1];
                        return (
                          <tr key={sym}>
                            <td><strong>{sym}</strong></td>
                            <td>{entries.length}</td>
                            <td>{last.cours.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                            <td>{last.date_import}</td>
                            <td>{last.devise}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Panneau Import source Bonobo ── */}
        {showBonoboPanel && (
          <div className="koala-panel bonobo-panel">
            <h3>🐒 Import source Bonobo</h3>
            <p className="koala-desc">
              Importe uniquement les colonnes <strong>3 (ISIN)</strong>, <strong>5 (Cours)</strong>
              et <strong>6 (Devise)</strong> depuis un fichier CSV Bonobo (séparateur&nbsp;<code>;</code>).
              Chaque import est horodaté et stocké dans l'historique de prix par ISIN.
              Aucune donnée n'est écrite en base de données.
            </p>
            <div className="koala-form">
              <input
                type="file"
                accept=".csv"
                className="form-input"
                onChange={(e) => setBonoboFile(e.target.files[0] || null)}
              />
              <button
                className="btn btn-primary"
                onClick={handleBonoboImport}
                disabled={bonoboImporting || !bonoboFile}
              >
                {bonoboImporting ? '⏳ Import en cours…' : '📥 Importer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleViewBonoboHistory}
              >
                {showBonoboHistory ? '🙈 Masquer l\'historique' : '📜 Voir l\'historique'}
              </button>
            </div>
            {bonoboMessage && (
              <div className={`message ${bonoboMessage.startsWith('✅') ? 'success' : 'error'}`}>
                {bonoboMessage}
              </div>
            )}
            {showBonoboHistory && bonoboHistory && (
              <div className="koala-history">
                <h4>Historique des cours (par ISIN)</h4>
                {Object.keys(bonoboHistory).length === 0 ? (
                  <p>Aucun historique disponible.</p>
                ) : (
                  <table className="data-table koala-history-table">
                    <thead>
                      <tr>
                        <th>ISIN</th>
                        <th>Entrées</th>
                        <th>Dernier cours</th>
                        <th>Dernière date</th>
                        <th>Devise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(bonoboHistory).sort().map(([isin, entries]) => {
                        const last = entries[entries.length - 1];
                        return (
                          <tr key={isin}>
                            <td><strong>{isin}</strong></td>
                            <td>{entries.length}</td>
                            <td>{last.cours.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                            <td>{last.date_import}</td>
                            <td>{last.devise}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
        
        {loading && <div className="loading">{t('signaletique.loading')}</div>}

        {error && (
          <div className="message error">
            ❌ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="data-stats">
              Affichage: <strong>{filteredData.length}</strong> / {data.length} titres
            </div>
            
            <div className="data-view-container">
              <div className="data-list">
                {filteredData.length === 0 ? (
                  <div className="no-data-message">
                    {t('signaletique.noData')}
                  </div>
                ) : (
                  filteredData.map((item) => {
                    const nomLong = getDisplayName(item) || 'Sans nom';
                    const typeInvest = item.donnees_supplementaires?.['Type d\'instr'] || '-';
                    const classeActif = item.donnees_supplementaires?.['Classe d\'actifs'] || '-';
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`data-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                        onClick={() => { setSelectedItem(item); setShowTitreHistory(false); setTitreHistory(null); setHistoryStatus(null); }}
                      >
                        <div className="item-header">
                          <div className="item-badges">
                            <span className="badge badge-type">{typeInvest}</span>
                            <span className="badge badge-class">{classeActif}</span>
                          </div>
                        </div>
                        <div className="item-name">{nomLong}</div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="details-frame">
                {selectedItem ? (
                  <div className="details-content">
                    <div className="details-header">
                      <h3>Caractéristiques</h3>
                      <div className="details-actions">
                        <button 
                          className="btn-small btn-primary"
                          onClick={openEditModal}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-small btn-history"
                          onClick={() => handleViewTitreHistory(selectedItem)}
                          title="Historique des cours"
                        >
                          📈
                        </button>
                        {selectedItem.isin && (
                          <a
                            href={`/prix-historique?isin=${selectedItem.isin}`}
                            title="Gérer l'historique des prix (ajouter, modifier, importer)"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: '#8e44ad', color: '#fff', border: 'none',
                              borderRadius: 4, padding: '4px 10px', fontSize: 12,
                              fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
                              lineHeight: 1.4,
                            }}
                          >
                            ✏️ Prix
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="details-grid">
                      <div className="detail-row">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">
                          {getDisplayName(selectedItem) || 'N/A'}
                        </span>
                      </div>
                      {(selectedItem.prix || selectedItem.source_prix) && (
                        <div className="detail-row detail-row-prix">
                          <span className="detail-label">💰 Prix / Cours:</span>
                          <span className="detail-value">
                            {selectedItem.prix
                              ? `${parseFloat(selectedItem.prix).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 4})} ${selectedItem.devise_prix || ''}`
                              : '-'}
                            {selectedItem.date_cours && (
                              <span className="detail-sub"> au {new Date(selectedItem.date_cours).toLocaleDateString('fr-FR')}</span>
                            )}
                            {selectedItem.source_prix && (
                              <span className="detail-sub source-prix"> ({selectedItem.source_prix})</span>
                            )}
                          </span>
                        </div>
                      )}
                      {selectedItem.frequence_coupon && (
                        <div className="detail-row">
                          <span className="detail-label">Fréq. Coupon:</span>
                          <span className="detail-value">{selectedItem.frequence_coupon}</span>
                        </div>
                      )}
                      {(() => {
                        const ds = selectedItem.donnees_supplementaires || {};
                        const normalizeKey = (key) => String(key)
                          .normalize('NFD')
                          .replace(/\p{Diacritic}/gu, '')
                          .toLowerCase()
                          .replace(/[^\p{L}\p{N}]+/gu, ' ')
                          .replace(/\s+/gu, ' ')
                          .trim();
                        const dsKeyMap = new Map(
                          Object.keys(ds).map((key) => [normalizeKey(key), key])
                        );

                        const orderedFields = [
                          { label: 'ISIN', keys: ['ISIN', 'Isin', 'isin'] },
                          { label: "Type d'instrument", keys: ["Type d'instrument", "Type d'instr", "Type d'instr."] },
                          { label: "Classe d'actifs", keys: ["Classe d'actifs", "Classe d’actifs", "Classe d'actif"] },
                          { label: 'CodeBank', keys: ['CodeBank', 'Code Bank'] },
                          { label: 'Symbole', keys: ['Symbole'] },
                          { label: 'Taux (%)', keys: ['Taux (%)', 'Taux %', 'Taux'] },
                          { label: 'Positions', keys: ['Positions'] },
                          { label: 'Date de fin', keys: ['Date de fin'] },
                          { label: 'Fréquence Coupon', keys: ['Frequence Coupon', 'Fréquence Coupon'] },
                          { label: 'Prix / Cours', keys: [] },  // handled separately

                          { label: 'Réplication', keys: ['Réplication', 'Replication'] },
                          { label: 'Qualité crédit', keys: ['Qualité crédit', 'Qualité credit', 'Qualite crédit', 'Qualite credit'] },
                          { label: 'Taille du Fonds', keys: ['Taille du Fonds'] },
                          { label: 'Couverture de change', keys: ['Couverture de change'] },
                          { label: 'Cap/Dis', keys: ['Cap/Dis', 'Cap-Dis', 'Cap - Dis'] },
                          { label: 'Devise', keys: ['Devise'] },
                          { label: 'TER (%)', keys: ['TER (%)', 'TER %', 'TER'] },
                          { label: 'ESG', keys: ['ESG'] }
                        ];

                        const isExcludedKey = (normalized) => {
                          if (/\bcode\b/.test(normalized)) return true;
                          if (/\bnom\b/.test(normalized)) return true;
                          if (/\btitre\b/.test(normalized)) return true;
                          return false;
                        };
                        const seen = new Set();

                        const orderedEntries = orderedFields
                          .map((field) => {
                            const key = field.keys
                              .map((k) => dsKeyMap.get(normalizeKey(k)))
                              .find(Boolean);
                            if (!key) return null;
                            const normalized = normalizeKey(key);
                            if (seen.has(normalized) || isExcludedKey(normalized)) return null;
                            seen.add(normalized);
                            return { label: field.label, value: ds[key] };
                          })
                          .filter(Boolean);

                        return orderedEntries.map(({ label, value }) => (
                          <div key={label} className="detail-row">
                            <span className="detail-label">{label}:</span>
                            <span className="detail-value">{value || '-'}</span>
                          </div>
                        ));
                      })()}
                    </div>

                    {showTitreHistory && (
                      <div className="titre-history-section">
                        <h4 className="titre-history-title">📈 Historique des cours</h4>
                        {loadingHistory ? (
                          <p className="loading-small">Chargement…</p>
                        ) : historyStatus === 'ok' && titreHistory && titreHistory.historique && titreHistory.historique.length > 0 ? (
                          <table className="data-table koala-history-table titre-history-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Cours</th>
                                <th>Devise</th>
                                <th>Source</th>
                              </tr>
                            </thead>
                            <tbody>
                              {titreHistory.historique.map((entry, idx) => (
                                <tr key={entry.id || idx}>
                                  <td>{entry.date}</td>
                                  <td>{Number(entry.cours).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                  <td>{entry.devise}</td>
                                  <td><span className={`source-badge source-${entry.source}`}>{entry.source}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : historyStatus === 'not_found' ? (
                          <p className="no-history-msg">
                            Aucun cours importé pour ce titre. Vérifiez que son ISIN figure dans les fichiers Koala ou Bonobo puis cliquez sur « 📥 Importer les prix ».
                          </p>
                        ) : historyStatus === 'error' ? (
                          <p className="no-history-msg">❌ Erreur lors du chargement de l’historique.</p>
                        ) : (
                          <p className="no-history-msg">
                            Aucun cours disponible. Cliquez sur « 🔗 Consolider les prix » pour associer les cours importés.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-selection">
                    <p>Sélectionnez un titre pour voir ses caractéristiques</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{modalMode === 'add' ? '➕ Ajouter un titre' : '✏️ Modifier le titre'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      value={formData.Nom}
                      onChange={(e) => setFormData({...formData, Nom: e.target.value})}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>ISIN {formData.Isin && `(${formData.Isin.length} caractères)`}</label>
                    <input
                      type="text"
                      value={formData.Isin}
                      onChange={(e) => setFormData({...formData, Isin: e.target.value.toUpperCase().trim()})}
                      maxLength="12"
                      placeholder="Ex: IE00BM67HK77"
                      className="form-input"
                      style={formData.Isin && formData.Isin.length !== 12 ? {borderColor: 'orange'} : {}}
                    />
                    {formData.Isin && formData.Isin.length !== 12 && (
                      <small style={{color: 'orange', fontSize: '12px'}}>
                        ⚠️ L'ISIN doit avoir exactement 12 caractères
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Type d'instrument</label>
                    <select
                      value={formData['Type d\'instr']}
                      onChange={(e) => setFormData({...formData, 'Type d\'instr': e.target.value})}
                      className="form-input"
                    >
                      <option value="">Sélectionner...</option>
                      {instrumentTypes.length > 0
                        ? instrumentTypes.map(it => (
                            <option key={it.id} value={it.name}>{it.name}</option>
                          ))
                        : [
                            <option key="ETF" value="ETF">ETF</option>,
                            <option key="Fonds" value="Fonds">Fonds</option>,
                            <option key="Obligations" value="Obligations">Obligations</option>,
                            <option key="Actions" value="Actions">Actions</option>,
                          ]
                      }
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Classe d'actifs (catégorie)</label>
                    <select
                      value={formData.categorie_id || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value ? parseInt(e.target.value) : null;
                        const selectedCategory = categories.find(cat => cat.id === selectedId);
                        setFormData({
                          ...formData, 
                          'categorie_id': selectedId,
                          'Classe d\'actifs': selectedCategory ? selectedCategory.name : ''
                        });
                      }}
                      className="form-input"
                    >
                      <option value="">Sélectionner...</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>


                  <div className="form-section-title">Informations complémentaires</div>

                  <div className="form-group">
                    <label>Symbole</label>
                    <input
                      type="text"
                      value={formData.Symbole}
                      onChange={(e) => setFormData({...formData, Symbole: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nom Long</label>
                    <input
                      type="text"
                      value={formData['Nom Long']}
                      onChange={(e) => setFormData({...formData, 'Nom Long': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Taux (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Taux}
                      onChange={(e) => setFormData({...formData, Taux: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Positions</label>
                    <input
                      type="number"
                      value={formData.Positions}
                      onChange={(e) => setFormData({...formData, Positions: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date de fin</label>
                    <input
                      type="date"
                      value={formData['Date de fin']}
                      onChange={(e) => setFormData({...formData, 'Date de fin': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Réplication</label>
                    <input
                      type="text"
                      value={formData.Replication}
                      onChange={(e) => setFormData({...formData, Replication: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Qualité crédit</label>
                    <input
                      type="text"
                      value={formData['Qualité credit']}
                      onChange={(e) => setFormData({...formData, 'Qualité credit': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Taille du Fonds</label>
                    <input
                      type="text"
                      value={formData['Taille du Fonds']}
                      onChange={(e) => setFormData({...formData, 'Taille du Fonds': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Couverture de change</label>
                    <input
                      type="text"
                      value={formData['Couverture de change']}
                      onChange={(e) => setFormData({...formData, 'Couverture de change': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-section-title">💰 Prix / Cours</div>

                  <div className="form-group">
                    <label>Prix / Cours</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.prix}
                      onChange={(e) => setFormData({...formData, prix: e.target.value})}
                      placeholder="Ex: 98.50"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Devise du prix</label>
                    <input
                      type="text"
                      value={formData.devise_prix}
                      onChange={(e) => setFormData({...formData, devise_prix: e.target.value.toUpperCase()})}
                      placeholder="EUR, USD..."
                      maxLength="10"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Source du prix</label>
                    <input
                      type="text"
                      list="sources-prix-list"
                      value={formData.source_prix}
                      onChange={(e) => setFormData({...formData, source_prix: e.target.value})}
                      placeholder="Manuel, Yahoo Finance..."
                      className="form-input"
                    />
                    <datalist id="sources-prix-list">
                      <option value="Manuel" />
                      <option value="Yahoo Finance" />
                      <option value="Bloomberg" />
                      <option value="Reuters" />
                      <option value="Site émetteur" />
                      <option value="Bourse" />
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label>Date du cours</label>
                    <input
                      type="date"
                      value={formData.date_cours}
                      onChange={(e) => setFormData({...formData, date_cours: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fréquence Coupon</label>
                    <select
                      value={formData.frequence_coupon}
                      onChange={(e) => setFormData({...formData, frequence_coupon: e.target.value})}
                      className="form-input"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="Annuelle">Annuelle</option>
                      <option value="Semi-annuelle">Semi-annuelle</option>
                      <option value="Trimestrielle">Trimestrielle</option>
                      <option value="Mensuelle">Mensuelle</option>
                      <option value="À l'échéance">À l'échéance</option>
                      <option value="Zéro coupon">Zéro coupon</option>
                    </select>
                  </div>

                  <div className="form-section-title">Émetteurs et disponibilité</div>

                  <div className="form-group">
                    <label>Banque Émetteur</label>
                    <input
                      type="text"
                      value={formData['Banque Emetteur']}
                      onChange={(e) => setFormData({...formData, 'Banque Emetteur': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Autre Émetteur</label>
                    <input
                      type="text"
                      value={formData['Autre Emetteur']}
                      onChange={(e) => setFormData({...formData, 'Autre Emetteur': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Banques Dispo</label>
                    <input
                      type="text"
                      value={formData['Banques Dispo']}
                      onChange={(e) => setFormData({...formData, 'Banques Dispo': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-section-title">Répartition géographique (%)</div>

                  <div className="form-group">
                    <label>USA</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.USA}
                      onChange={(e) => setFormData({...formData, USA: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Canada</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Canada}
                      onChange={(e) => setFormData({...formData, Canada: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>France</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.France}
                      onChange={(e) => setFormData({...formData, France: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Allemagne</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Allemagne}
                      onChange={(e) => setFormData({...formData, Allemagne: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Grande Bretagne</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Grande Bretagne']}
                      onChange={(e) => setFormData({...formData, 'Grande Bretagne': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Suisse</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Suisse}
                      onChange={(e) => setFormData({...formData, Suisse: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Espagne</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Espagne}
                      onChange={(e) => setFormData({...formData, Espagne: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Italie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Italie}
                      onChange={(e) => setFormData({...formData, Italie: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Pays-Bas</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Pays-Bas']}
                      onChange={(e) => setFormData({...formData, 'Pays-Bas': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Suède</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Suède}
                      onChange={(e) => setFormData({...formData, Suède: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Irlande</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Irlande}
                      onChange={(e) => setFormData({...formData, Irlande: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Israel</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Israel}
                      onChange={(e) => setFormData({...formData, Israel: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Australie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Australie}
                      onChange={(e) => setFormData({...formData, Australie: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nouvelle Zélande</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Nouvelle Zelande']}
                      onChange={(e) => setFormData({...formData, 'Nouvelle Zelande': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Japon</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Japon}
                      onChange={(e) => setFormData({...formData, Japon: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Chine</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Chine}
                      onChange={(e) => setFormData({...formData, Chine: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Pays Émergents (hors Chine/Japon)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Pays Emergeants Hors Chine et Japon']}
                      onChange={(e) => setFormData({...formData, 'Pays Emergeants Hors Chine et Japon': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Autre Pays</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Autre Pays']}
                      onChange={(e) => setFormData({...formData, 'Autre Pays': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Etats</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Etats}
                      onChange={(e) => setFormData({...formData, Etats: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Etats 2</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Etats2}
                      onChange={(e) => setFormData({...formData, Etats2: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-section-title">Répartition sectorielle (%)</div>

                  <div className="form-group">
                    <label>Finance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Finance}
                      onChange={(e) => setFormData({...formData, Finance: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Technologie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Technologie}
                      onChange={(e) => setFormData({...formData, Technologie: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Santé</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Santé}
                      onChange={(e) => setFormData({...formData, Santé: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Industrie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Industrie}
                      onChange={(e) => setFormData({...formData, Industrie: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Énergie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Energie}
                      onChange={(e) => setFormData({...formData, Energie: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Matières Premières</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Matières Premières']}
                      onChange={(e) => setFormData({...formData, 'Matières Premières': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Immobilier</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Immobilier}
                      onChange={(e) => setFormData({...formData, Immobilier: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Communication</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Communication}
                      onChange={(e) => setFormData({...formData, Communication: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Services Publiques</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Service Publiques']}
                      onChange={(e) => setFormData({...formData, 'Service Publiques': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Consommation Cyclique</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Consommation Cyclique']}
                      onChange={(e) => setFormData({...formData, 'Consommation Cyclique': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Consommation Défensive</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Consommation Defensive']}
                      onChange={(e) => setFormData({...formData, 'Consommation Defensive': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Services de consommation</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Services de consommation']}
                      onChange={(e) => setFormData({...formData, 'Services de consommation': e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Entreprises</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.Entreprises}
                      onChange={(e) => setFormData({...formData, Entreprises: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Autre Secteur</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData['Autre Secteur']}
                      onChange={(e) => setFormData({...formData, 'Autre Secteur': e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cap/Dis</label>
                    <select
                      value={formData['Cap/Dis']}
                      onChange={(e) => setFormData({...formData, 'Cap/Dis': e.target.value})}
                      className="form-input"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Capitalisation">Capitalisation</option>
                      <option value="Distribution">Distribution</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Devise</label>
                    <input
                      type="text"
                      value={formData.Devise}
                      onChange={(e) => setFormData({...formData, Devise: e.target.value})}
                      placeholder="EUR, USD..."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>TER (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.TER}
                      onChange={(e) => setFormData({...formData, TER: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>ESG</label>
                    <select
                      value={formData.ESG}
                      onChange={(e) => setFormData({...formData, ESG: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalMode === 'add' ? 'Ajouter' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default SignaletiqueList;
