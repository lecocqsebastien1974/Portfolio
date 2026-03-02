import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function PortfolioAnalysis() {
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('positions');
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');
  const [showActionsDetail, setShowActionsDetail] = useState(false);
  const [showObligationsDetail, setShowObligationsDetail] = useState(false);
  const [showImmobilierDetail, setShowImmobilierDetail] = useState(false);
  const [showLongShortDetail, setShowLongShortDetail] = useState(false);
  const [showMatieresDetail, setShowMatieresDetail] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoadingPortfolios(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/real-portfolios/`);
      if (!response.ok) throw new Error('Erreur lors du chargement des portefeuilles');
      const data = await response.json();
      setPortfolios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPortfolios(false);
    }
  };

  const analyzePortfolio = async (portfolio) => {
    setSelectedPortfolio(portfolio);
    setAnalysis(null);
    setActiveTab('positions');
    setLoadingAnalysis(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/real-portfolios/${portfolio.id}/fifo-analysis/`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'analyse");
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const formatCurrency = (value, devise = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const isObligation = (categorie, typeInstrument = '') => {
    const catLower = (categorie || '').toLowerCase();
    const typeLower = (typeInstrument || '').toLowerCase();
    return catLower.includes('obligation') || typeLower.includes('obligation');
  };

  const formatPrice = (value, devise, categorie, typeInstrument) => {
    // Pour les obligations, afficher le prix en % avec 2 décimales
    if (isObligation(categorie, typeInstrument)) {
      return formatNumber(value, 2) + ' %';
    }
    return formatCurrency(value, devise);
  };

  const totalValeurPortefeuille = analysis?.positions_actuelles?.reduce(
    (sum, p) => sum + (p.valeur || 0), 0
  ) || 0;

  const groupBy = (arr, key) => {
    return arr.reduce((groups, item) => {
      const group = item[key] || 'Non classé';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {});
  };

  const normalizeKey = (value) => {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const normalized = String(value)
      .replace('%', '')
      .replace(',', '.')
      .trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getValue = (ds, label) => {
    if (!ds) return 0;
    const keyMap = new Map(Object.keys(ds).map((key) => [normalizeKey(key), key]));
    const matchedKey = keyMap.get(normalizeKey(label));
    return parseNumber(matchedKey ? ds[matchedKey] : 0);
  };

  const calculateRepartition = (positions, fields) => {
    const totalValeur = positions.reduce((sum, pos) => sum + (pos.valeur || 0), 0);
    if (totalValeur === 0) return [];

    const result = fields.map((field) => {
      const total = positions.reduce((sum, pos) => {
        const poids = (pos.valeur || 0) / totalValeur;
        const value = getValue(pos.donnees_supplementaires, field);
        return sum + (poids * value * 100); // Multiplier par 100 car poids est en décimal
      }, 0);
      return { field, total };
    });

    return result.sort((a, b) => b.total - a.total);
  };

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>

        <h1>📊 Analyse de Portefeuilles</h1>
        <p>Analysez vos portefeuilles réels avec calcul FIFO</p>

        {error && (
          <div style={{
            color: '#e74c3c',
            backgroundColor: 'rgba(231,76,60,0.15)',
            border: '1px solid #e74c3c',
            padding: '12px 20px',
            borderRadius: '6px',
            marginBottom: '20px',
            width: '100%',
            maxWidth: '900px'
          }}>
             {error}
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '900px', marginTop: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>Sélectionnez un portefeuille</h2>

          {loadingPortfolios ? (
            <p>Chargement des portefeuilles...</p>
          ) : portfolios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#bdc3c7' }}>
              <p>Aucun portefeuille disponible.</p>
              <Link to="/portfolios" className="btn btn-primary" style={{ marginTop: '16px' }}>
                 Importer des transactions
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {portfolios.map(portfolio => (
                <button
                  key={portfolio.id}
                  onClick={() => analyzePortfolio(portfolio)}
                  className="btn"
                  style={{
                    padding: '14px 24px',
                    fontSize: '15px',
                    background: selectedPortfolio?.id === portfolio.id
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#34495e',
                    color: 'white',
                    border: selectedPortfolio?.id === portfolio.id
                      ? '2px solid #667eea'
                      : '2px solid transparent',
                    fontWeight: selectedPortfolio?.id === portfolio.id ? 'bold' : 'normal'
                  }}
                >
                  💼 {portfolio.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPortfolio && (
          <div style={{ width: '100%', maxWidth: '900px', marginTop: '40px' }}>
            <button
              onClick={() => { setSelectedPortfolio(null); setAnalysis(null); }}
              className="btn btn-secondary"
              style={{ marginBottom: '24px' }}
            >
              ← Retour à la liste
            </button>
            {loadingAnalysis ? (
              <p>⏳ Chargement de l'analyse FIFO...</p>
            ) : analysis ? (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '30px'
                }}>
                  <StatCard label="Valeur totale" value={formatCurrency(totalValeurPortefeuille)} color="#3498db" />
                  <StatCard label="Positions actives" value={analysis.statistiques.nombre_titres_en_portefeuille} color="#2ecc71" />
                  <StatCard
                    label="P&L réalisé"
                    value={formatCurrency(analysis.pnl_realise?.total || 0)}
                    color={(analysis.pnl_realise?.total || 0) >= 0 ? '#2ecc71' : '#e74c3c'}
                  />
                  <StatCard label="Transactions" value={analysis.statistiques.nombre_transactions} color="#e67e22" />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'positions', label: '📈 Positions actives' },
                    { key: 'pnl', label: '💰 P&L réalisé' },
                    { key: 'transactions', label: '📋 Transactions' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="btn"
                      style={{
                        background: activeTab === tab.key
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#34495e',
                        color: 'white',
                        fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                        padding: '10px 20px'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'positions' && (
                  analysis.positions_actuelles.length === 0 ? (
                    <p style={{ color: '#bdc3c7' }}>Aucune position active dans ce portefeuille.</p>
                  ) : (
                    Object.entries(groupBy(analysis.positions_actuelles, 'categorie'))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([categorie, positions]) => {
                        const valeurClasse = positions.reduce((s, p) => s + (p.valeur || 0), 0);
                        const pctClasse = totalValeurPortefeuille > 0
                          ? (valeurClasse / totalValeurPortefeuille * 100).toFixed(1)
                          : '0.0';
                        return (
                          <div key={categorie} style={{ marginBottom: '28px' }}>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              backgroundColor: '#1a252f', padding: '10px 14px',
                              borderRadius: '6px 6px 0 0', borderBottom: '2px solid #667eea'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#667eea' }}>
                                  {categorie}
                                </span>
                                {categorie.toLowerCase().includes('action') && (
                                  <button
                                    onClick={() => setShowActionsDetail(true)}
                                    className="btn"
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                      color: 'white',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📊 Voir répartition géo/secteurs
                                  </button>
                                )}
                                {categorie.toLowerCase().includes('obligation') && (
                                  <button
                                    onClick={() => setShowObligationsDetail(true)}
                                    className="btn"
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
                                      color: 'white',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📊 Voir répartition géo/secteurs
                                  </button>
                                )}
                                {categorie.toLowerCase().includes('immobilier') && (
                                  <button
                                    onClick={() => setShowImmobilierDetail(true)}
                                    className="btn"
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                                      color: 'white',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📊 Voir répartition géo/secteurs
                                  </button>
                                )}
                                {categorie.toLowerCase().includes('long') && categorie.toLowerCase().includes('short') && (
                                  <button
                                    onClick={() => setShowLongShortDetail(true)}
                                    className="btn"
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                                      color: 'white',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📊 Voir répartition géo/secteurs
                                  </button>
                                )}
                                {(categorie.toLowerCase().includes('matière') || categorie.toLowerCase().includes('matiere')) && (
                                  <button
                                    onClick={() => setShowMatieresDetail(true)}
                                    className="btn"
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '12px',
                                      background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                                      color: 'white',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📊 Voir répartition géo/secteurs
                                  </button>
                                )}
                              </div>
                              <span style={{ color: '#bdc3c7', fontSize: '13px' }}>
                                {formatCurrency(valeurClasse)} &mdash; {pctClasse}% du portefeuille
                              </span>
                            </div>
                            <TableContainer>
                              <table style={tableStyle}>
                                <thead>
                                  <tr style={{ backgroundColor: '#1e2d3d' }}>
                                    <Th>Titre</Th>
                                    <Th>Type</Th>
                                    <Th>ISIN</Th>
                                    <Th align="right">Quantité</Th>
                                    <Th align="right">Prix moyen</Th>
                                    <Th align="right">Valeur</Th>
                                    <Th align="right">% portef.</Th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {positions.sort((a, b) => b.valeur - a.valeur).map((pos, i) => {
                                    const pct = totalValeurPortefeuille > 0
                                      ? (pos.valeur / totalValeurPortefeuille * 100).toFixed(1) : '0.0';
                                    return (
                                      <tr key={pos.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                                        <Td>{pos.titre}</Td>
                                        <Td color="#3498db">{pos.type_instrument || '-'}</Td>
                                        <Td mono>{pos.isin}</Td>
                                        <Td align="right">{formatNumber(pos.quantite)}</Td>
                                        <Td align="right">{formatPrice(pos.prix_moyen, pos.devise, pos.categorie, pos.type_instrument)}</Td>
                                        <Td align="right" bold>{formatCurrency(pos.valeur, pos.devise)}</Td>
                                        <Td align="right" color="#3498db">{pct}%</Td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </TableContainer>
                          </div>
                        );
                      })
                  )
                )}

                {activeTab === 'pnl' && (
                  analysis.pnl_realise.par_titre.length === 0 ? (
                    <p style={{ color: '#bdc3c7' }}>Aucune vente effectuée (P&L réalisé nul).</p>
                  ) : (
                    <>
                      {Object.entries(groupBy(analysis.pnl_realise.par_titre, 'categorie'))
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([categorie, items]) => {
                          const pnlClasse = items.reduce((s, i) => s + i.pnl_total, 0);
                          return (
                            <div key={categorie} style={{ marginBottom: '28px' }}>
                              <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: '#1a252f', padding: '10px 14px',
                                borderRadius: '6px 6px 0 0', borderBottom: '2px solid #667eea'
                              }}>
                                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#667eea' }}>
                                  {categorie}
                                </span>
                                <span style={{ fontWeight: 'bold', fontSize: '14px',
                                  color: pnlClasse >= 0 ? '#2ecc71' : '#e74c3c' }}>
                                  {pnlClasse >= 0 ? '+' : ''}{formatCurrency(pnlClasse)}
                                </span>
                              </div>
                              <TableContainer>
                                <table style={tableStyle}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#1e2d3d' }}>
                                      <Th>Titre</Th>
                                      <Th>Type</Th>
                                      <Th>ISIN</Th>
                                      <Th align="right">P&L total réalisé</Th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.sort((a, b) => b.pnl_total - a.pnl_total).map((item, i) => (
                                      <tr key={item.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                                        <Td>{item.titre}</Td>
                                        <Td color="#3498db">{item.type_instrument || '-'}</Td>
                                        <Td mono>{item.isin}</Td>
                                        <Td align="right" bold color={item.pnl_total >= 0 ? '#2ecc71' : '#e74c3c'}>
                                          {item.pnl_total >= 0 ? '+' : ''}{formatCurrency(item.pnl_total)}
                                        </Td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </TableContainer>
                            </div>
                          );
                        })}
                      <div style={{ textAlign: 'right', marginTop: '10px', padding: '12px',
                        backgroundColor: '#1a252f', borderRadius: '6px' }}>
                        <span style={{ color: '#bdc3c7', marginRight: '16px' }}>Total P&L réalisé :</span>
                        <span style={{ fontWeight: 'bold', fontSize: '18px',
                          color: analysis.pnl_realise.total >= 0 ? '#2ecc71' : '#e74c3c' }}>
                          {analysis.pnl_realise.total >= 0 ? '+' : ''}{formatCurrency(analysis.pnl_realise.total)}
                        </span>
                      </div>
                    </>
                  )
                )}

                {activeTab === 'transactions' && (
                  analysis.transactions.length === 0 ? (
                    <p style={{ color: '#bdc3c7' }}>Aucune transaction enregistrée.</p>
                  ) : (
                    Object.entries(groupBy(analysis.transactions, 'categorie'))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([categorie, txs]) => (
                        <div key={categorie} style={{ marginBottom: '28px' }}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: '#1a252f', padding: '10px 14px',
                            borderRadius: '6px 6px 0 0', borderBottom: '2px solid #667eea'
                          }}>
                            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#667eea' }}>
                              {categorie}
                            </span>
                            <span style={{ color: '#bdc3c7', fontSize: '13px' }}>
                              {txs.length} transaction{txs.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <TableContainer>
                            <table style={tableStyle}>
                              <thead>
                                <tr style={{ backgroundColor: '#1e2d3d' }}>
                                  <Th>Date</Th>
                                  <Th>Type Op.</Th>
                                  <Th>Type</Th>
                                  <Th>Titre</Th>
                                  <Th align="right">Quantité</Th>
                                  <Th align="right">Prix unit.</Th>
                                  <Th align="right">Montant</Th>
                                  <Th align="right">P&L</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {txs.map((tx, i) => (
                                  <tr key={tx.id} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                                    <Td>{formatDate(tx.date)}</Td>
                                    <Td color={tx.type === 'ACHAT' ? '#3498db' : '#e67e22'} bold>{tx.type}</Td>
                                    <Td color="#95a5a6">{tx.type_instrument || '-'}</Td>
                                    <Td>{tx.titre}</Td>
                                    <Td align="right">{formatNumber(tx.quantite)}</Td>
                                    <Td align="right">{formatPrice(tx.prix_unitaire, tx.devise, tx.categorie, tx.type_instrument)}</Td>
                                    <Td align="right">{formatCurrency(tx.montant, tx.devise)}</Td>
                                    <Td align="right" color={
                                      tx.pnl === undefined ? '#bdc3c7' : tx.pnl >= 0 ? '#2ecc71' : '#e74c3c'
                                    }>
                                      {tx.pnl !== undefined
                                        ? `${tx.pnl >= 0 ? '+' : ''}${formatCurrency(tx.pnl)}`
                                        : '-'}
                                    </Td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </TableContainer>
                        </div>
                      ))
                  )
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Modal de détail pour les Actions */}
        {showActionsDetail && analysis && (
          <ActionsDetailModal
            positions={analysis.positions_actuelles.filter(p => 
              (p.categorie || '').toLowerCase().includes('action')
            )}
            onClose={() => setShowActionsDetail(false)}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            calculateRepartition={calculateRepartition}
            getValue={getValue}
          />
        )}        {showObligationsDetail && analysis && (
          <ObligationsDetailModal
            positions={analysis.positions_actuelles.filter(p =>
              p.categorie && p.categorie.toLowerCase().includes('obligation')
            )}
            onClose={() => setShowObligationsDetail(false)}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            calculateRepartition={calculateRepartition}
            getValue={getValue}
          />
        )}
        {showImmobilierDetail && analysis && (
          <ImmobilierDetailModal
            positions={analysis.positions_actuelles.filter(p =>
              p.categorie && p.categorie.toLowerCase().includes('immobilier')
            )}
            onClose={() => setShowImmobilierDetail(false)}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            calculateRepartition={calculateRepartition}
            getValue={getValue}
          />
        )}
        {showLongShortDetail && analysis && (
          <LongShortDetailModal
            positions={analysis.positions_actuelles.filter(p =>
              p.categorie && p.categorie.toLowerCase().includes('long') && p.categorie.toLowerCase().includes('short')
            )}
            onClose={() => setShowLongShortDetail(false)}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            calculateRepartition={calculateRepartition}
            getValue={getValue}
          />
        )}
        {showMatieresDetail && analysis && (
          <MatieresDetailModal
            positions={analysis.positions_actuelles.filter(p =>
              p.categorie && (p.categorie.toLowerCase().includes('matière') || p.categorie.toLowerCase().includes('matiere'))
            )}
            onClose={() => setShowMatieresDetail(false)}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            calculateRepartition={calculateRepartition}
            getValue={getValue}
          />
        )}      </header>
    </div>
  );
}

function ActionsDetailModal({ positions, onClose, formatNumber, formatCurrency, calculateRepartition, getValue }) {
  const geoFields = [
    'USA', 'Japon', 'Grande Bretagne', 'Canada', 'Pays Emergeants Hors Chine et Japon',
    'Australie', 'Suède', 'Suisse', 'Chine', 'Israel', 'Allemagne', 'Nouvelle Zelande',
    'Pays-Bas', 'Irlande', 'Espagne', 'Italie', 'France', 'Autre Pays'
  ];

  const sectorFields = [
    'Etats', 'Industrie', 'Finance', 'Consommation Cyclique', 'Technologie',
    'Santé', 'Consommation Defensive', 'Communication', 'Immobilier',
    'Matières Premières', 'Energie', 'Service Publiques', 'Services de consommation', 'Autre Secteur'
  ];

  const geoTotals = calculateRepartition(positions, geoFields);
  const sectorTotals = calculateRepartition(positions, sectorFields);
  
  const totalValeur = positions.reduce((sum, pos) => sum + (pos.valeur || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,  
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#667eea', marginBottom: '10px' }}>📊 Répartition des Actions</h2>
        <p style={{ color: '#bdc3c7', marginBottom: '25px' }}>
          Valeur totale : {formatCurrency(totalValeur)} • {positions.length} position{positions.length > 1 ? 's' : ''}
        </p>

        {/* Répartition géographique */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#3498db', marginBottom: '15px', fontSize: '18px' }}>
            🌍 Répartition Géographique
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {geoTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`geo-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3498db'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(geoTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Répartition sectorielle */}
        <div>
          <h3 style={{ color: '#e67e22', marginBottom: '15px', fontSize: '18px' }}>
            🏭 Répartition Sectorielle
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {sectorTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`sector-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #e67e22'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(sectorTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Détail par position */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2ecc71', marginBottom: '15px', fontSize: '18px' }}>
            📋 Détail par position
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1a252f' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a252f' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7', fontWeight: '600' }}>
                    Titre
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Valeur
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Poids
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .sort((a, b) => (b.valeur || 0) - (a.valeur || 0))
                  .map((pos, i) => {
                    const poids = totalValeur > 0 ? ((pos.valeur || 0) / totalValeur * 100) : 0;
                    return (
                      <tr key={pos.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                        <td style={{ padding: '10px', color: 'white' }}>
                          {pos.titre}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(pos.valeur, pos.devise)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#3498db' }}>
                          {formatNumber(poids, 1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ObligationsDetailModal({ positions, onClose, formatNumber, formatCurrency, calculateRepartition, getValue }) {
  const geoFields = [
    'USA', 'Japon', 'Grande Bretagne', 'Canada', 'Pays Emergeants Hors Chine et Japon',
    'Australie', 'Suède', 'Suisse', 'Chine', 'Israel', 'Allemagne', 'Nouvelle Zelande',
    'Pays-Bas', 'Irlande', 'Espagne', 'Italie', 'France', 'Autre Pays'
  ];

  const sectorFields = [
    'Industrie', 'Finance', 'Consommation Cyclique', 'Technologie',
    'Santé', 'Consommation Defensive', 'Communication', 'Immobilier',
    'Matières Premières', 'Energie', 'Service Publiques', 'Services de consommation', 'Autre Secteur'
  ];

  const geoTotals = calculateRepartition(positions, geoFields);
  const sectorTotals = calculateRepartition(positions, sectorFields);
  const totalValeur = positions.reduce((sum, pos) => sum + (pos.valeur || 0), 0);

  // Calcul du Time to Maturity
  const calculateTimeToMaturity = (position) => {
    const ds = position.donnees_supplementaires || {};
    const dateFin = ds['Date de fin'] || ds['date de fin'] || ds['Date De Fin'];
    if (!dateFin) return null;

    try {
      const endDate = new Date(dateFin);
      const today = new Date();
      if (isNaN(endDate.getTime())) return null;

      const diffTime = endDate - today;
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      return diffYears > 0 ? diffYears : null;
    } catch {
      return null;
    }
  };

  // Calcul du TTM moyen pondéré
  let totalTTMWeighted = 0;
  let totalWeightWithTTM = 0;
  const positionsWithTTM = [];

  positions.forEach(pos => {
    const ttm = calculateTimeToMaturity(pos);
    const weight = totalValeur > 0 ? (pos.valeur || 0) / totalValeur : 0;
    
    if (ttm !== null) {
      totalTTMWeighted += ttm * weight;
      totalWeightWithTTM += weight;
      positionsWithTTM.push({ ...pos, ttm, weight: weight * 100 });
    } else {
      positionsWithTTM.push({ ...pos, ttm: null, weight: weight * 100 });
    }
  });

  const averageTTM = totalWeightWithTTM > 0 ? totalTTMWeighted / totalWeightWithTTM : 0;

  // Distribution par tranches de maturité
  const ttmRanges = [
    { label: '< 1 an', min: 0, max: 1 },
    { label: '1-3 ans', min: 1, max: 3 },
    { label: '3-5 ans', min: 3, max: 5 },
    { label: '5-7 ans', min: 5, max: 7 },
    { label: '7-10 ans', min: 7, max: 10 },
    { label: '> 10 ans', min: 10, max: Infinity }
  ];

  const ttmDistribution = ttmRanges.map(range => {
    const rangeWeight = positionsWithTTM
      .filter(pos => pos.ttm !== null && pos.ttm >= range.min && pos.ttm < range.max)
      .reduce((sum, pos) => sum + pos.weight, 0);
    return { label: range.label, weight: rangeWeight };
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#e67e22', marginBottom: '10px' }}>📊 Répartition des Obligations</h2>
        <p style={{ color: '#bdc3c7', marginBottom: '25px' }}>
          Valeur totale : {formatCurrency(totalValeur)} • {positions.length} position{positions.length > 1 ? 's' : ''}
        </p>

        {/* Répartition géographique */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#3498db', marginBottom: '15px', fontSize: '18px' }}>
            🌍 Répartition Géographique
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {geoTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`geo-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3498db'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(geoTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Répartition sectorielle */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#e67e22', marginBottom: '15px', fontSize: '18px' }}>
            🏭 Répartition Sectorielle
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {sectorTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`sector-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #e67e22'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(sectorTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Time to Maturity */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#9b59b6', marginBottom: '15px', fontSize: '18px' }}>
            ⏱️ Time to Maturity
          </h3>
          <div style={{
            backgroundColor: '#34495e',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '15px',
            textAlign: 'center',
            border: '2px solid #9b59b6'
          }}>
            <div style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '8px' }}>
              Maturité Moyenne Pondérée
            </div>
            <div style={{ fontSize: '28px', color: '#9b59b6', fontWeight: 'bold' }}>
              {averageTTM > 0 ? formatNumber(averageTTM, 2) : 'N/A'} {averageTTM > 0 && 'ans'}
            </div>
            {totalWeightWithTTM < 1 && totalWeightWithTTM > 0 && (
              <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '8px' }}>
                ⚠️ {formatNumber((1 - totalWeightWithTTM) * 100, 0)}% des positions sans date de fin
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {ttmDistribution.map((item, idx) => (
              <div
                key={`ttm-${idx}`}
                style={{
                  backgroundColor: item.weight > 0 ? '#34495e' : '#2c3e50',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${item.weight > 0 ? '#9b59b6' : '#34495e'}`,
                  opacity: item.weight > 0 ? 1 : 0.5
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '16px', color: item.weight > 0 ? 'white' : '#7f8c8d', fontWeight: 'bold' }}>
                  {formatNumber(item.weight, 1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail par position */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2ecc71', marginBottom: '15px', fontSize: '18px' }}>
            📋 Détail par position
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1a252f' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a252f' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7', fontWeight: '600' }}>
                    Titre
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Valeur
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Poids
                  </th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#bdc3c7', fontWeight: '600' }}>
                    Date de fin
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    TTM (ans)
                  </th>
                </tr>
              </thead>
              <tbody>
                {positionsWithTTM
                  .sort((a, b) => (b.valeur || 0) - (a.valeur || 0))
                  .map((pos, i) => {
                    const ds = pos.donnees_supplementaires || {};
                    const dateFin = ds['Date de fin'] || ds['date de fin'] || ds['Date De Fin'];
                    const dateFinFormatted = dateFin ? new Date(dateFin).toLocaleDateString('fr-FR') : '-';
                    
                    return (
                      <tr key={pos.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                        <td style={{ padding: '10px', color: 'white' }}>
                          {pos.titre}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(pos.valeur, pos.devise)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#3498db' }}>
                          {formatNumber(pos.weight, 1)}%
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#bdc3c7' }}>
                          {dateFinFormatted}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: pos.ttm !== null ? '#9b59b6' : '#7f8c8d', fontWeight: pos.ttm !== null ? 'bold' : 'normal' }}>
                          {pos.ttm !== null ? formatNumber(pos.ttm, 2) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn"
            style={{
              padding: '10px 30px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function ImmobilierDetailModal({ positions, onClose, formatNumber, formatCurrency, calculateRepartition, getValue }) {
  const geoFields = [
    'USA', 'Japon', 'Grande Bretagne', 'Canada', 'Pays Emergeants Hors Chine et Japon',
    'Australie', 'Suède', 'Suisse', 'Chine', 'Israel', 'Allemagne', 'Nouvelle Zelande',
    'Pays-Bas', 'Irlande', 'Espagne', 'Italie', 'France', 'Autre Pays'
  ];

  const sectorFields = [
    'Etats', 'Industrie', 'Finance', 'Consommation Cyclique', 'Technologie',
    'Santé', 'Consommation Defensive', 'Communication', 'Immobilier',
    'Matières Premières', 'Energie', 'Service Publiques', 'Services de consommation', 'Autre Secteur'
  ];

  const geoTotals = calculateRepartition(positions, geoFields);
  const sectorTotals = calculateRepartition(positions, sectorFields);
  const totalValeur = positions.reduce((sum, pos) => sum + (pos.valeur || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#9b59b6', marginBottom: '10px' }}>📊 Répartition Immobilier</h2>
        <p style={{ color: '#bdc3c7', marginBottom: '25px' }}>
          Valeur totale : {formatCurrency(totalValeur)} • {positions.length} position{positions.length > 1 ? 's' : ''}
        </p>

        {/* Répartition géographique */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#3498db', marginBottom: '15px', fontSize: '18px' }}>
            🌍 Répartition Géographique
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {geoTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`geo-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3498db'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(geoTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Répartition sectorielle */}
        <div>
          <h3 style={{ color: '#e67e22', marginBottom: '15px', fontSize: '18px' }}>
            🏭 Répartition Sectorielle
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {sectorTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`sector-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #e67e22'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(sectorTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Détail par position */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2ecc71', marginBottom: '15px', fontSize: '18px' }}>
            📋 Détail par position
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1a252f' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a252f' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7', fontWeight: '600' }}>
                    Titre
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Valeur
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Poids
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .sort((a, b) => (b.valeur || 0) - (a.valeur || 0))
                  .map((pos, i) => {
                    const poids = totalValeur > 0 ? ((pos.valeur || 0) / totalValeur * 100) : 0;
                    return (
                      <tr key={pos.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                        <td style={{ padding: '10px', color: 'white' }}>
                          {pos.titre}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(pos.valeur, pos.devise)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#3498db' }}>
                          {formatNumber(poids, 1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn"
            style={{
              padding: '10px 30px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function LongShortDetailModal({ positions, onClose, formatNumber, formatCurrency, calculateRepartition, getValue }) {
  const geoFields = [
    'USA', 'Japon', 'Grande Bretagne', 'Canada', 'Pays Emergeants Hors Chine et Japon',
    'Australie', 'Suède', 'Suisse', 'Chine', 'Israel', 'Allemagne', 'Nouvelle Zelande',
    'Pays-Bas', 'Irlande', 'Espagne', 'Italie', 'France', 'Autre Pays'
  ];

  const sectorFields = [
    'Etats', 'Industrie', 'Finance', 'Consommation Cyclique', 'Technologie',
    'Santé', 'Consommation Defensive', 'Communication', 'Immobilier',
    'Matières Premières', 'Energie', 'Service Publiques', 'Services de consommation', 'Autre Secteur'
  ];

  const geoTotals = calculateRepartition(positions, geoFields);
  const sectorTotals = calculateRepartition(positions, sectorFields);
  const totalValeur = positions.reduce((sum, pos) => sum + (pos.valeur || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#1abc9c', marginBottom: '10px' }}>📊 Répartition Long/Short</h2>
        <p style={{ color: '#bdc3c7', marginBottom: '25px' }}>
          Valeur totale : {formatCurrency(totalValeur)} • {positions.length} position{positions.length > 1 ? 's' : ''}
        </p>

        {/* Répartition géographique */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#3498db', marginBottom: '15px', fontSize: '18px' }}>
            🌍 Répartition Géographique
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {geoTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`geo-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3498db'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(geoTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Répartition sectorielle */}
        <div>
          <h3 style={{ color: '#e67e22', marginBottom: '15px', fontSize: '18px' }}>
            🏭 Répartition Sectorielle
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {sectorTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`sector-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #e67e22'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(sectorTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Détail par position */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2ecc71', marginBottom: '15px', fontSize: '18px' }}>
            📋 Détail par position
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1a252f' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a252f' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7', fontWeight: '600' }}>
                    Titre
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Valeur
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Poids
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .sort((a, b) => (b.valeur || 0) - (a.valeur || 0))
                  .map((pos, i) => {
                    const poids = totalValeur > 0 ? ((pos.valeur || 0) / totalValeur * 100) : 0;
                    return (
                      <tr key={pos.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                        <td style={{ padding: '10px', color: 'white' }}>
                          {pos.titre}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(pos.valeur, pos.devise)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#3498db' }}>
                          {formatNumber(poids, 1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn"
            style={{
              padding: '10px 30px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function MatieresDetailModal({ positions, onClose, formatNumber, formatCurrency, calculateRepartition, getValue }) {
  const geoFields = [
    'USA', 'Japon', 'Grande Bretagne', 'Canada', 'Pays Emergeants Hors Chine et Japon',
    'Australie', 'Suède', 'Suisse', 'Chine', 'Israel', 'Allemagne', 'Nouvelle Zelande',
    'Pays-Bas', 'Irlande', 'Espagne', 'Italie', 'France', 'Autre Pays'
  ];

  const sectorFields = [
    'Etats', 'Industrie', 'Finance', 'Consommation Cyclique', 'Technologie',
    'Santé', 'Consommation Defensive', 'Communication', 'Immobilier',
    'Matières Premières', 'Energie', 'Service Publiques', 'Services de consommation', 'Autre Secteur'
  ];

  const geoTotals = calculateRepartition(positions, geoFields);
  const sectorTotals = calculateRepartition(positions, sectorFields);
  const totalValeur = positions.reduce((sum, pos) => sum + (pos.valeur || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#f39c12', marginBottom: '10px' }}>📊 Répartition Matières Premières</h2>
        <p style={{ color: '#bdc3c7', marginBottom: '25px' }}>
          Valeur totale : {formatCurrency(totalValeur)} • {positions.length} position{positions.length > 1 ? 's' : ''}
        </p>

        {/* Répartition géographique */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#3498db', marginBottom: '15px', fontSize: '18px' }}>
            🌍 Répartition Géographique
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {geoTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`geo-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3498db'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(geoTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Répartition sectorielle */}
        <div>
          <h3 style={{ color: '#e67e22', marginBottom: '15px', fontSize: '18px' }}>
            🏭 Répartition Sectorielle
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {sectorTotals.filter(item => item.total > 0.1).map((item) => (
              <div
                key={`sector-${item.field}`}
                style={{
                  backgroundColor: '#34495e',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #e67e22'
                }}
              >
                <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '4px' }}>
                  {item.field}
                </div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                  {formatNumber(item.total, 1)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'right',
            padding: '10px',
            color: '#bdc3c7',
            fontSize: '14px'
          }}>
            Total: {formatNumber(sectorTotals.reduce((s, i) => s + i.total, 0), 1)}%
          </div>
        </div>

        {/* Détail par position */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#2ecc71', marginBottom: '15px', fontSize: '18px' }}>
            📋 Détail par position
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1a252f' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a252f' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#bdc3c7', fontWeight: '600' }}>
                    Titre
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Valeur
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#bdc3c7', fontWeight: '600' }}>
                    Poids
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .sort((a, b) => (b.valeur || 0) - (a.valeur || 0))
                  .map((pos, i) => {
                    const poids = totalValeur > 0 ? ((pos.valeur || 0) / totalValeur * 100) : 0;
                    return (
                      <tr key={pos.isin} style={{ backgroundColor: i % 2 === 0 ? '#2c3e50' : '#34495e' }}>
                        <td style={{ padding: '10px', color: 'white' }}>
                          {pos.titre}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(pos.valeur, pos.devise)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#3498db' }}>
                          {formatNumber(poids, 1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn"
            style={{
              padding: '10px 30px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      backgroundColor: '#2c3e50',
      border: `1px solid ${color}33`,
      padding: '20px',
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      <p style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <p style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
}

function TableContainer({ children }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1a252f' }}>
      {children}
    </div>
  );
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px'
};

function Th({ children, align = 'left' }) {
  return (
    <th style={{
      padding: '12px 14px',
      textAlign: align,
      color: '#bdc3c7',
      fontWeight: '600',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '2px solid #1a252f'
    }}>
      {children}
    </th>
  );
}

function Td({ children, align = 'left', bold, color, mono }) {
  return (
    <td style={{
      padding: '11px 14px',
      textAlign: align,
      fontWeight: bold ? 'bold' : 'normal',
      color: color || 'white',
      fontFamily: mono ? 'monospace' : 'inherit',
      fontSize: mono ? '13px' : '14px',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      {children}
    </td>
  );
}

export default PortfolioAnalysis;
