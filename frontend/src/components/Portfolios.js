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

  // États pour l'import cash Excel
  const [cashImportFile, setCashImportFile] = useState(null);
  const [cashImporting, setCashImporting] = useState(false);
  const [cashImportMessage, setCashImportMessage] = useState('');
  
  // États pour la saisie manuelle d'opération
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    portfolio_id: '',
    type_operation: 'ACHAT',
    isin: '',
    date: new Date().toISOString().split('T')[0],
    quantite: '',
    prix_unitaire: '',
    devise: 'EUR'
  });
  const [transactionMessage, setTransactionMessage] = useState('');
  const [savingTransaction, setSavingTransaction] = useState(false);

  // États pour la gestion du cash
  const [cashEntries, setCashEntries] = useState([]);
  const [showCashForm, setShowCashForm] = useState(false);
  const [cashForm, setCashForm] = useState({
    portfolio: '',
    banque: '',
    montant: '',
    devise: 'EUR',
    date: new Date().toISOString().split('T')[0],
    commentaire: ''
  });
  const [cashMessage, setCashMessage] = useState('');

  const apiBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => {
    fetchPortfolios();
    fetchCashEntries();
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

  const fetchCashEntries = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/cash/`);
      const data = await response.json();
      setCashEntries(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCashFormChange = (e) => {
    const { name, value } = e.target;
    setCashForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTransactionFormChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const { portfolio_id, type_operation, isin, date, quantite, prix_unitaire, devise } = transactionForm;

    if (!portfolio_id || !isin || !date || !quantite || !prix_unitaire) {
      setTransactionMessage('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSavingTransaction(true);
    setTransactionMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/transactions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: parseInt(portfolio_id),
          type_operation,
          isin: isin.trim().toUpperCase(),
          date,
          quantite,
          prix_unitaire,
          devise
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTransactionMessage('✅ Opération ajoutée avec succès');
        setTransactionForm({
          portfolio_id: '',
          type_operation: 'ACHAT',
          isin: '',
          date: new Date().toISOString().split('T')[0],
          quantite: '',
          prix_unitaire: '',
          devise: 'EUR'
        });
        setShowTransactionForm(false);
        fetchPortfolios();
        setTimeout(() => setTransactionMessage(''), 4000);
      } else {
        setTransactionMessage(`❌ ${data.error || 'Erreur lors de la création'}`);
        setTimeout(() => setTransactionMessage(''), 6000);
      }
    } catch (error) {
      setTransactionMessage(`❌ Erreur: ${error.message}`);
      setTimeout(() => setTransactionMessage(''), 6000);
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleAddCash = async (e) => {
    e.preventDefault();
    
    if (!cashForm.portfolio || !cashForm.banque || !cashForm.montant || !cashForm.date) {
      setCashMessage('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/cash/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cashForm),
      });

      if (response.ok) {
        setCashMessage('✅ Entrée de cash ajoutée avec succès');
        setCashForm({
          portfolio: '',
          banque: '',
          montant: '',
          devise: 'EUR',
          date: new Date().toISOString().split('T')[0],
          commentaire: ''
        });
        setShowCashForm(false);
        await fetchCashEntries();
        // Effacer le message après 3 secondes
        setTimeout(() => {
          setCashMessage('');
        }, 3000);
      } else {
        const data = await response.json();
        setCashMessage(`❌ Erreur: ${JSON.stringify(data)}`);
        // Effacer le message d'erreur après 5 secondes
        setTimeout(() => {
          setCashMessage('');
        }, 5000);
      }
    } catch (error) {
      setCashMessage(`❌ Erreur: ${error.message}`);
      // Effacer le message d'erreur après 5 secondes
      setTimeout(() => {
        setCashMessage('');
      }, 5000);
    }
  };

  const handleDeleteCash = async (cashId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée de cash ?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/cash/${cashId}/`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setCashMessage('✅ Entrée de cash supprimée avec succès');
        // Rafraîchir la liste immédiatement
        await fetchCashEntries();
        // Effacer le message après 3 secondes
        setTimeout(() => {
          setCashMessage('');
        }, 3000);
      } else {
        setCashMessage('❌ Erreur lors de la suppression');
        // Effacer le message d'erreur après 5 secondes
        setTimeout(() => {
          setCashMessage('');
        }, 5000);
      }
    } catch (error) {
      setCashMessage(`❌ Erreur: ${error.message}`);
      // Effacer le message d'erreur après 5 secondes
      setTimeout(() => {
        setCashMessage('');
      }, 5000);
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

  const handleCashImport = async () => {
    if (!cashImportFile) {
      setCashImportMessage('⚠️ Veuillez sélectionner un fichier');
      return;
    }
    setCashImporting(true);
    setCashImportMessage('');
    try {
      const formData = new FormData();
      formData.append('file', cashImportFile);
      const response = await fetch(`${apiBaseUrl}/api/import/cash/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        let msg = `✅ Import terminé ! ${data.details.succes} entrée(s) importée(s)`;
        if (data.details.erreurs > 0) msg += ` — ⚠️ ${data.details.erreurs} erreur(s)`;
        if (data.details.liste_erreurs?.length) {
          msg += '\n' + data.details.liste_erreurs.map(e => `Ligne ${e.ligne}: ${e.erreur}`).join('\n');
        }
        setCashImportMessage(msg);
        setCashImportFile(null);
        const inp = document.getElementById('cash-import-file');
        if (inp) inp.value = '';
        fetchCashEntries();
        fetchPortfolios();
        setTimeout(() => setCashImportMessage(''), 6000);
      } else {
        setCashImportMessage(`❌ ${data.error || 'Erreur lors de l\'import'}`);
        setTimeout(() => setCashImportMessage(''), 6000);
      }
    } catch (error) {
      setCashImportMessage(`❌ Erreur: ${error.message}`);
      setTimeout(() => setCashImportMessage(''), 6000);
    } finally {
      setCashImporting(false);
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

        <div className="cash-container" style={{marginTop: '40px', borderTop: '2px solid #444', paddingTop: '30px'}}>
          <h2>✏️ Saisie manuelle d'une opération</h2>
          <p>Ajoutez une transaction directement sans passer par un fichier Excel</p>

          <button
            className="btn btn-primary"
            onClick={() => setShowTransactionForm(!showTransactionForm)}
            style={{marginBottom: '20px'}}
          >
            {showTransactionForm ? '❌ Annuler' : '➕ Ajouter une opération'}
          </button>

          {showTransactionForm && (
            <form onSubmit={handleAddTransaction} style={{
              backgroundColor: '#1a1a1a',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Portefeuille *</label>
                <select name="portfolio_id" value={transactionForm.portfolio_id} onChange={handleTransactionFormChange} required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}>
                  <option value="">-- Sélectionner un portefeuille --</option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Type d'opération *</label>
                <select name="type_operation" value={transactionForm.type_operation} onChange={handleTransactionFormChange} required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}>
                  <option value="ACHAT">ACHAT</option>
                  <option value="VENTE">VENTE</option>
                </select>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>ISIN * <span style={{fontSize: '12px', color: '#aaa'}}>(12 caractères, ex: FR0010315770)</span></label>
                <input type="text" name="isin" value={transactionForm.isin} onChange={handleTransactionFormChange}
                  required maxLength={12} placeholder="FR0010315770"
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px', textTransform: 'uppercase'}} />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Date *</label>
                <input type="date" name="date" value={transactionForm.date} onChange={handleTransactionFormChange} required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}} />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Quantité *</label>
                <input type="number" name="quantite" value={transactionForm.quantite} onChange={handleTransactionFormChange}
                  required step="any" min="0" placeholder="100"
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}} />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Prix unitaire *</label>
                <input type="number" name="prix_unitaire" value={transactionForm.prix_unitaire} onChange={handleTransactionFormChange}
                  required step="any" min="0" placeholder="50.25"
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}} />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label>Devise *</label>
                <select name="devise" value={transactionForm.devise} onChange={handleTransactionFormChange} required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dollar américain</option>
                  <option value="GBP">GBP - Livre sterling</option>
                  <option value="CHF">CHF - Franc suisse</option>
                  <option value="JPY">JPY - Yen japonais</option>
                  <option value="CAD">CAD - Dollar canadien</option>
                  <option value="AUD">AUD - Dollar australien</option>
                  <option value="SEK">SEK - Couronne suédoise</option>
                  <option value="NOK">NOK - Couronne norvégienne</option>
                  <option value="DKK">DKK - Couronne danoise</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingTransaction}>
                {savingTransaction ? '⏳ Enregistrement...' : '💾 Enregistrer l\'opération'}
              </button>
            </form>
          )}

          {transactionMessage && (
            <div className={`message ${transactionMessage.includes('✅') ? 'success' : 'error'}`} style={{marginTop: '10px'}}>
              {transactionMessage}
            </div>
          )}
        </div>

        <div className="cash-container" style={{marginTop: '40px', borderTop: '2px solid #444', paddingTop: '30px'}}>
          <h2>💰 Gestion du Cash</h2>
          <p>Gérez vos soldes de cash par portefeuille et banque</p>

          {/* Import Excel cash */}
          <div style={{backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '30px'}}>
            <h3>📥 Importer depuis Excel</h3>
            <p style={{fontSize: '14px', color: '#aaa', marginBottom: '10px'}}>
              Format attendu : <strong>Portefeuille, Banque, Montant, Devise, Date, Commentaire</strong>
            </p>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="cash-import-file"
                onChange={(e) => { setCashImportFile(e.target.files[0]); setCashImportMessage(''); }}
                accept=".xlsx,.xls"
                disabled={cashImporting}
              />
              <label htmlFor="cash-import-file" className="file-input-label">
                {cashImportFile ? `📄 ${cashImportFile.name}` : '📁 Choisir un fichier Excel'}
              </label>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCashImport}
              disabled={!cashImportFile || cashImporting}
              style={{marginTop: '10px'}}
            >
              {cashImporting ? '⏳ Import en cours...' : '📤 Importer le cash'}
            </button>
            {cashImportMessage && (
              <div className={`message ${cashImportMessage.includes('✅') ? 'success' : 'error'}`} style={{marginTop: '10px', whiteSpace: 'pre-line'}}>
                {cashImportMessage}
              </div>
            )}
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setShowCashForm(!showCashForm)}
            style={{marginBottom: '20px'}}
          >
            {showCashForm ? '❌ Annuler' : '➕ Ajouter une entrée de cash'}
          </button>

          {showCashForm && (
            <form onSubmit={handleAddCash} className="cash-form" style={{
              backgroundColor: '#1a1a1a',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <div className="form-group" style={{marginBottom: '15px'}}>
                <label htmlFor="portfolio">Portefeuille *</label>
                <select
                  id="portfolio"
                  name="portfolio"
                  value={cashForm.portfolio}
                  onChange={handleCashFormChange}
                  required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}
                >
                  <option value="">-- Sélectionner un portefeuille --</option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label htmlFor="banque">Banque *</label>
                <input
                  type="text"
                  id="banque"
                  name="banque"
                  value={cashForm.banque}
                  onChange={handleCashFormChange}
                  required
                  placeholder="Ex: BNP Paribas, Crédit Agricole..."
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}
                />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label htmlFor="montant">Montant *</label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={cashForm.montant}
                  onChange={handleCashFormChange}
                  required
                  step="0.01"
                  placeholder="1000.00"
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}
                />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label htmlFor="devise">Devise *</label>
                <select
                  id="devise"
                  name="devise"
                  value={cashForm.devise}
                  onChange={handleCashFormChange}
                  required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dollar américain</option>
                  <option value="GBP">GBP - Livre sterling</option>
                  <option value="CHF">CHF - Franc suisse</option>
                  <option value="JPY">JPY - Yen japonais</option>
                  <option value="CAD">CAD - Dollar canadien</option>
                  <option value="AUD">AUD - Dollar australien</option>
                  <option value="CNY">CNY - Yuan chinois</option>
                  <option value="SEK">SEK - Couronne suédoise</option>
                  <option value="NOK">NOK - Couronne norvégienne</option>
                  <option value="DKK">DKK - Couronne danoise</option>
                  <option value="SGD">SGD - Dollar de Singapour</option>
                  <option value="HKD">HKD - Dollar de Hong Kong</option>
                  <option value="NZD">NZD - Dollar néo-zélandais</option>
                  <option value="KRW">KRW - Won sud-coréen</option>
                  <option value="MXN">MXN - Peso mexicain</option>
                  <option value="BRL">BRL - Réal brésilien</option>
                  <option value="INR">INR - Roupie indienne</option>
                  <option value="RUB">RUB - Rouble russe</option>
                  <option value="ZAR">ZAR - Rand sud-africain</option>
                  <option value="TRY">TRY - Livre turque</option>
                  <option value="PLN">PLN - Zloty polonais</option>
                  <option value="THB">THB - Baht thaïlandais</option>
                  <option value="MYR">MYR - Ringgit malaisien</option>
                  <option value="IDR">IDR - Roupie indonésienne</option>
                </select>
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={cashForm.date}
                  onChange={handleCashFormChange}
                  required
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}
                />
              </div>

              <div className="form-group" style={{marginBottom: '15px'}}>
                <label htmlFor="commentaire">Commentaire</label>
                <textarea
                  id="commentaire"
                  name="commentaire"
                  value={cashForm.commentaire}
                  onChange={handleCashFormChange}
                  placeholder="Notes optionnelles..."
                  rows="3"
                  style={{width: '100%', padding: '8px', marginTop: '5px', borderRadius: '5px'}}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                💾 Enregistrer
              </button>
            </form>
          )}

          {cashMessage && (
            <div className={`message ${cashMessage.includes('✅') ? 'success' : 'error'}`} style={{marginTop: '15px'}}>
              {cashMessage}
            </div>
          )}

          <div className="cash-list" style={{marginTop: '30px'}}>
            <h3>📊 Entrées de cash</h3>
            
            {cashEntries.length === 0 ? (
              <p>Aucune entrée de cash. Ajoutez-en une pour commencer.</p>
            ) : (
              <div className="cash-entries" style={{display: 'grid', gap: '15px', marginTop: '20px'}}>
                {cashEntries.map(entry => {
                  const portfolio = portfolios.find(p => p.id === entry.portfolio);
                  return (
                    <div 
                      key={entry.id} 
                      className="cash-entry"
                      style={{
                        backgroundColor: '#1a1a1a',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #444'
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                        <div>
                          <h4 style={{margin: '0 0 10px 0'}}>
                            🏦 {entry.banque}
                          </h4>
                          <p style={{margin: '5px 0'}}>
                            <strong>Portefeuille:</strong> {portfolio?.name || 'N/A'}
                          </p>
                          <p style={{margin: '5px 0'}}>
                            <strong>Montant:</strong> {parseFloat(entry.montant).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {entry.devise}
                          </p>
                          <p style={{margin: '5px 0'}}>
                            <strong>Date:</strong> {new Date(entry.date).toLocaleDateString('fr-FR')}
                          </p>
                          {entry.commentaire && (
                            <p style={{margin: '5px 0', fontStyle: 'italic'}}>
                              <strong>Commentaire:</strong> {entry.commentaire}
                            </p>
                          )}
                        </div>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteCash(entry.id)}
                          style={{padding: '5px 10px', fontSize: '12px'}}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default Portfolios;
