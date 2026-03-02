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
                              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#667eea' }}>
                                {categorie}
                              </span>
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
      </header>
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
