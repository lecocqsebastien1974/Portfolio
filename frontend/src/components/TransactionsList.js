import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function TransactionsList() {
  const { t } = useLanguage();
  const { portfolioId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');

  const apiBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => {
    fetchAnalysis();
  }, [portfolioId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/real-portfolios/${portfolioId}/fifo-analysis/`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Confirmer la suppression de cette transaction ?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/transactions/${transactionId}/`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setMessage('✅ Transaction supprimée');
        // Rafraîchir l'analyse
        fetchAnalysis();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <p>Chargement...</p>
        </header>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="App">
        <header className="App-header">
          <p>Aucune donnée disponible</p>
        </header>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/portfolios" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        
        <h1>📊 {analysis.portfolio.name}</h1>
        <p>Analyse FIFO et Transactions</p>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Statistiques globales */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{analysis.statistiques.nombre_transactions}</div>
            <div className="stat-label">Transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analysis.statistiques.nombre_titres_en_portefeuille}</div>
            <div className="stat-label">Titres en portefeuille</div>
          </div>
          <div className="stat-card pnl-card">
            <div className={`stat-value ${analysis.pnl_realise.total >= 0 ? 'positive' : 'negative'}`}>
              {formatNumber(analysis.pnl_realise.total)} €
            </div>
            <div className="stat-label">P&L Réalisé</div>
          </div>
        </div>

        {/* Onglets */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            📋 Transactions
          </button>
          <button
            className={`tab ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            💼 Positions Actuelles
          </button>
          <button
            className={`tab ${activeTab === 'pnl' ? 'active' : ''}`}
            onClick={() => setActiveTab('pnl')}
          >
            💰 P&L Détaillé
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="tab-content-wide">
          {activeTab === 'transactions' && (
            <div className="table-container">
              <h2>📋 Toutes les transactions</h2>
              {analysis.transactions.length === 0 ? (
                <p>Aucune transaction</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Titre</th>
                      <th>Quantité</th>
                      <th>Prix Unit.</th>
                      <th>Montant</th>
                      <th>P&L</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{formatDate(transaction.date)}</td>
                        <td>
                          <span className={`badge ${transaction.type === 'ACHAT' ? 'badge-buy' : 'badge-sell'}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>{transaction.titre}</td>
                        <td>{formatNumber(transaction.quantite)}</td>
                        <td>{formatNumber(transaction.prix_unitaire)} {transaction.devise}</td>
                        <td>{formatNumber(transaction.montant)} {transaction.devise}</td>
                        <td>
                          {transaction.pnl !== undefined && (
                            <span className={transaction.pnl >= 0 ? 'positive' : 'negative'}>
                              {formatNumber(transaction.pnl)} €
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(transaction.id)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="table-container">
              <h2>💼 Positions Actuelles (FIFO)</h2>
              {analysis.positions_actuelles.length === 0 ? (
                <p>Aucune position ouverte</p>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th>ISIN</th>
                        <th>Quantité</th>
                        <th>Prix Moyen</th>
                        <th>Valeur</th>
                        <th>Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.positions_actuelles.map((position, idx) => (
                        <React.Fragment key={idx}>
                          <tr>
                            <td>{position.titre}</td>
                            <td>{position.isin}</td>
                            <td>{formatNumber(position.quantite)}</td>
                            <td>{formatNumber(position.prix_moyen)} {position.devise}</td>
                            <td><strong>{formatNumber(position.valeur)} {position.devise}</strong></td>
                            <td>
                              <button
                                className="btn-icon"
                                onClick={() => {
                                  const row = document.getElementById(`lots-${idx}`);
                                  row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                                }}
                              >
                                📊
                              </button>
                            </td>
                          </tr>
                          <tr id={`lots-${idx}`} style={{display: 'none'}} className="detail-row">
                            <td colSpan="6">
                              <div className="lots-detail">
                                <strong>Lots FIFO :</strong>
                                <ul>
                                  {position.lots.map((lot, lotIdx) => (
                                    <li key={lotIdx}>
                                      {formatDate(lot.date)} : {formatNumber(lot.quantite)} @ {formatNumber(lot.prix_unitaire)} {position.devise}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  <div className="valeur-totale">
                    <strong>Valeur totale du portefeuille : </strong>
                    {formatNumber(analysis.positions_actuelles.reduce((sum, p) => sum + p.valeur, 0))} €
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'pnl' && (
            <div className="table-container">
              <h2>💰 P&L Réalisé (FIFO)</h2>
              <div className="pnl-total">
                <strong>P&L Total Réalisé : </strong>
                <span className={analysis.pnl_realise.total >= 0 ? 'positive' : 'negative'}>
                  {formatNumber(analysis.pnl_realise.total)} €
                </span>
              </div>
              
              {analysis.pnl_realise.par_titre.length === 0 ? (
                <p>Aucune vente réalisée</p>
              ) : (
                analysis.pnl_realise.par_titre.map((item, idx) => (
                  <div key={idx} className="pnl-section">
                    <h3>
                      {item.titre} 
                      <span className={item.pnl_total >= 0 ? 'positive' : 'negative'}>
                        {' '}({formatNumber(item.pnl_total)} €)
                      </span>
                    </h3>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Quantité</th>
                          <th>Prix Vente</th>
                          <th>P&L</th>
                          <th>Détails</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.ventes.map((vente, venteIdx) => (
                          <React.Fragment key={venteIdx}>
                            <tr>
                              <td>{formatDate(vente.date)}</td>
                              <td>{formatNumber(vente.quantite)}</td>
                              <td>{formatNumber(vente.prix_vente)} €</td>
                              <td className={vente.pnl >= 0 ? 'positive' : 'negative'}>
                                {formatNumber(vente.pnl)} €
                              </td>
                              <td>
                                <button
                                  className="btn-icon"
                                  onClick={() => {
                                    const row = document.getElementById(`lots-detail-${idx}-${venteIdx}`);
                                    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                                  }}
                                >
                                  📊
                                </button>
                              </td>
                            </tr>
                            <tr id={`lots-detail-${idx}-${venteIdx}`} style={{display: 'none'}} className="detail-row">
                              <td colSpan="5">
                                <div className="lots-detail">
                                  <strong>Lots consommés (FIFO) :</strong>
                                  <ul>
                                    {vente.lots_consommes.map((lot, lotIdx) => (
                                      <li key={lotIdx}>
                                        {formatNumber(lot.quantite)} @ {formatNumber(lot.prix_achat)} € 
                                        → {formatNumber(lot.prix_vente)} € 
                                        <span className={lot.pnl >= 0 ? 'positive' : 'negative'}>
                                          {' '}(P&L: {formatNumber(lot.pnl)} €)
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default TransactionsList;
