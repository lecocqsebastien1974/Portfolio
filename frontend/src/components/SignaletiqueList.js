import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function SignaletiqueList() {
  const { t, language, changeLanguage } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    code: '',
    Nom: '',
    Isin: '',
    'Type d\'instr': '',
    'Classe d\'actifs': '',
    'Cap/Dis': '',
    Devise: '',
    TER: '',
    ESG: '',
    Symbole: '',
    'Nom Long': '',
    Taux: '',
    Positions: '',
    'Date de fin': '',
    Replication: '',
    'Qualité credit': '',
    'Taille du Fonds': '',
    'Couverture de change': '',
    'Banque Emetteur': '',
    'Autre Emetteur': '',
    'Banques Dispo': '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleDelete = async (id) => {
    if (!window.confirm(t('signaletique.confirmDelete'))) return;

    try {
      const response = await fetch(`${API_URL}/api/signaletique/${id}/`, {
        method: 'DELETE',
      });
      
      if (response.ok || response.status === 204) {
        setData(data.filter(item => item.id !== id));
        setSelectedItem(null);
        alert(t('signaletique.deleteSuccess'));
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err) {
      alert(`${t('signaletique.deleteError')}: ${err.message}`);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(t('signaletique.confirmDeleteAll'))) return;

    try {
      const response = await fetch(`${API_URL}/api/signaletique/clear/`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setData([]);
      setSelectedItem(null);
      alert(t('signaletique.deleteAllSuccess'));
    } catch (err) {
      alert(`${t('signaletique.deleteAllError')}: ${err.message}`);
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
      'Cap/Dis': '',
      Devise: '',
      TER: '',
      ESG: ''
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    setModalMode('edit');
    const ds = selectedItem.donnees_supplementaires || {};
    setFormData({
      code: selectedItem.code,
      Nom: ds['Nom'] || '',
      Isin: ds['Isin'] || '',
      'Type d\'instr': ds['Type d\'instr'] || '',
      'Classe d\'actifs': ds['Classe d\'actifs'] || '',
      'Cap/Dis': ds['Cap/Dis'] || '',
      Devise: ds['Devise'] || '',
      TER: ds['TER'] || '',
      ESG: ds['ESG'] || '',
      Symbole: ds['Symbole'] || '',
      'Nom Long': ds['Nom Long'] || '',
      Taux: ds['Taux'] || '',
      Positions: ds['Positions'] || '',
      'Date de fin': ds['Date de fin'] || '',
      Replication: ds['Replication'] || '',
      'Qualité credit': ds['Qualité credit'] || '',
      'Taille du Fonds': ds['Taille du Fonds'] || '',
      'Couverture de change': ds['Couverture de change'] || '',
      'Banque Emetteur': ds['Banque Emetteur'] || '',
      'Autre Emetteur': ds['Autre Emetteur'] || '',
      'Banques Dispo': ds['Banques Dispo'] || '',
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
    
    try {
      const payload = {
        code: formData.code,
        titre: formData.Nom,
        donnees_supplementaires: {
          ...formData,
          Code: formData.code
        }
      };

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

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      
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
    
    const matchesSearch = nomLong.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code?.toLowerCase().includes(searchTerm.toLowerCase());
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
        <Link to="/admin" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        
        <h1>{t('signaletique.title')}</h1>
        <p>{t('signaletique.subtitle')}</p>

        <div className="button-container">
          <button className="btn btn-danger" onClick={handleDeleteAll}>
            {t('signaletique.deleteAll')}
          </button>
        </div>

        <div className="filters-section">
          <div className="search-filter">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Rechercher par nom ou code..."
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
          </div>
        </div>

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
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="item-header">
                          <span className="item-code">{item.code}</span>
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
                          className="btn-small btn-danger"
                          onClick={() => handleDelete(selectedItem.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="details-grid">
                      <div className="detail-row">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">
                          {getDisplayName(selectedItem) || 'N/A'}
                        </span>
                      </div>
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
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'add' ? '➕ Ajouter un titre' : '✏️ Modifier le titre'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      required
                      disabled={modalMode === 'edit'}
                      className="form-input"
                    />
                  </div>

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
                    <label>ISIN</label>
                    <input
                      type="text"
                      value={formData.Isin}
                      onChange={(e) => setFormData({...formData, Isin: e.target.value})}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Type d'instrument</label>
                    <select
                      value={formData['Type d\'instr']}
                      onChange={(e) => setFormData({...formData, 'Type d\'instr': e.target.value})}
                      className="form-input"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Actions">Actions</option>
                      <option value="Obligations">Obligations</option>
                      <option value="ETF">ETF</option>
                      <option value="Fonds">Fonds</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Classe d'actifs</label>
                    <select
                      value={formData['Classe d\'actifs']}
                      onChange={(e) => setFormData({...formData, 'Classe d\'actifs': e.target.value})}
                      className="form-input"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Actions">Actions</option>
                      <option value="Obligations">Obligations</option>
                      <option value="Monétaire">Monétaire</option>
                      <option value="Mixte">Mixte</option>
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
