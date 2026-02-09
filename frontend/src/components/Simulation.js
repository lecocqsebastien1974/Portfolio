import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../App.css';

function Simulation() {
  const { t, language, changeLanguage } = useLanguage();
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([
    { id: 1, titleId: '', titleText: '', ratio: '' }
  ]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [portfoliosError, setPortfoliosError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [activeRowId, setActiveRowId] = useState(null);

  const normalizeKey = (value) => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const getDsValue = (ds, label) => {
    if (!ds) return '';
    const keyMap = new Map(Object.keys(ds).map((key) => [normalizeKey(key), key]));
    const matchedKey = keyMap.get(normalizeKey(label));
    return matchedKey ? ds[matchedKey] : '';
  };

  const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

  const fetchTitles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/signaletique/`);
      if (!response.ok) throw new Error(t('simulation.errorTitles'));
      const result = await response.json();
      setTitles(result);
      setError('');
    } catch (err) {
      setError(err.message || t('simulation.errorTitles'));
    } finally {
      setLoading(false);
    }
  }, [API_URL, t]);

  const fetchPortfolios = useCallback(async () => {
    try {
      setPortfoliosLoading(true);
      const response = await fetch(`${API_URL}/api/target-portfolios/`);
      if (response.status === 404) {
        setPortfolios([]);
        setPortfoliosError('');
        return;
      }
      if (!response.ok) throw new Error(t('simulation.errorPortfolios'));
      const result = await response.json();
      setPortfolios(Array.isArray(result) ? result : []);
      setPortfoliosError('');
    } catch (err) {
      setPortfoliosError(err.message || t('simulation.errorPortfolios'));
    } finally {
      setPortfoliosLoading(false);
    }
  }, [API_URL, t]);

  useEffect(() => {
    fetchTitles();
    fetchPortfolios();
  }, [fetchTitles, fetchPortfolios]);

  useEffect(() => {
    if (!statusMessage) return;
    const timeoutId = setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [statusMessage]);

  const titleOptions = useMemo(() => {
    return titles.map((item) => {
      const ds = item.donnees_supplementaires || {};
      const name = getDsValue(ds, 'Nom') || item.titre || '';
      const code = item.code || ds['Code'] || '';
      const label = name || code || `#${item.id}`;
      return { value: item.id, label };
    });
  }, [titles]);

  const normalizedTitleMap = useMemo(() => {
    const map = new Map();
    titleOptions.forEach((option) => {
      const normalized = normalizeKey(option.label);
      if (normalized && !map.has(normalized)) {
        map.set(normalized, option);
      }
    });
    return map;
  }, [titleOptions, normalizeKey]);

  const findTitleOptionByText = useCallback((value) => {
    const normalized = normalizeKey(value || '');
    return normalized ? normalizedTitleMap.get(normalized) : null;
  }, [normalizedTitleMap, normalizeKey]);

  const getFilteredOptions = useCallback((filterValue) => {
    const filter = (filterValue || '').trim();
    if (!filter) return titleOptions.slice(0, 20);
    try {
      const regex = new RegExp(filter, 'i');
      return titleOptions.filter((option) => regex.test(option.label)).slice(0, 50);
    } catch (err) {
      const lowered = filter.toLowerCase();
      return titleOptions
        .filter((option) => option.label.toLowerCase().includes(lowered))
        .slice(0, 50);
    }
  }, [titleOptions]);

  const titleMap = useMemo(() => {
    return new Map(titleOptions.map((option) => [String(option.value), option.label]));
  }, [titleOptions]);

  const totalRatio = useMemo(() => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.ratio) || 0), 0);
  }, [rows]);

  const hasDuplicates = useMemo(() => {
    const ids = rows.map((row) => row.titleId).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }, [rows]);

  const isTotalValid = useMemo(() => {
    return Math.abs(totalRatio - 100) <= 0.01;
  }, [totalRatio]);

  const isValid = useMemo(() => {
    if (!isTotalValid) return false;
    if (!name.trim()) return false;
    if (hasDuplicates) return false;
    return rows.every((row) => row.titleId && parseFloat(row.ratio) > 0);
  }, [rows, name, isTotalValid, hasDuplicates]);

  const hasMissingFields = useMemo(() => {
    return rows.some((row) => !row.titleId || !(parseFloat(row.ratio) > 0));
  }, [rows]);

  const resetForm = () => {
    setName('');
    setRows([{ id: Date.now(), titleId: '', titleText: '', ratio: '' }]);
    setEditingId(null);
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), titleId: '', titleText: '', ratio: '' }
    ]);
  };

  const handleRemoveRow = (id) => {
    setRows((prev) => prev.length > 1 ? prev.filter((row) => row.id !== id) : prev);
  };

  const handleRowChange = (id, field, value) => {
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      return { ...row, [field]: value };
    }));
  };

  const handleTitleTextChange = (id, value) => {
    const trimmed = value.trim();
    const match = findTitleOptionByText(trimmed);
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        titleText: value,
        titleId: trimmed && match ? String(match.value) : ''
      };
    }));
    setActiveRowId(id);
  };

  const handleTitleSelect = (id, option) => {
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        titleText: option.label,
        titleId: String(option.value)
      };
    }));
    setActiveRowId(null);
  };


  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        name: name.trim(),
        items: rows.map((row) => ({
          signaletique: Number(row.titleId),
          ratio: Number(row.ratio)
        }))
      };

      const url = editingId
        ? `${API_URL}/api/target-portfolios/${editingId}/`
        : `${API_URL}/api/target-portfolios/`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorText =
          data?.non_field_errors?.[0] ||
          data?.items?.[0] ||
          data?.name?.[0] ||
          data?.error ||
          t('simulation.saveError');
        setStatusMessage({ type: 'error', text: errorText });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: editingId ? t('simulation.updateSuccess') : t('simulation.createSuccess')
      });
      resetForm();
      fetchPortfolios();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || t('simulation.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (portfolio) => {
    setEditingId(portfolio.id);
    setName(portfolio.name || '');
    setRows(
      (portfolio.items || []).map((item) => {
        const titleId = String(item.signaletique);
        return {
          id: item.id || Date.now() + Math.random(),
          titleId,
          titleText: titleMap.get(titleId) || '',
          ratio: String(item.ratio)
        };
      })
    );
    if (!portfolio.items || portfolio.items.length === 0) {
      setRows([{ id: Date.now(), titleId: '', titleText: '', ratio: '' }]);
    }
    setStatusMessage(null);
  };

  const handleDelete = async (portfolioId) => {
    if (!window.confirm(t('simulation.confirmDelete'))) return;

    try {
      const response = await fetch(`${API_URL}/api/target-portfolios/${portfolioId}/`, {
        method: 'DELETE'
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(t('simulation.deleteError'));
      }

      if (editingId === portfolioId) {
        resetForm();
      }

      setStatusMessage({ type: 'success', text: t('simulation.deleteSuccess') });
      fetchPortfolios();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || t('simulation.deleteError') });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setStatusMessage(null);
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
      </div>
      <header className="App-header">
        <Link to="/" className="btn btn-secondary back-button">
          {t('common.back')}
        </Link>
        <h1>{t('simulation.title')}</h1>
        <p>{t('simulation.subtitle')}</p>

        <div className="simulation-card">
          <div className="simulation-header">
            <h2>{t('simulation.menuTitle')}</h2>
            <button className="btn btn-success" onClick={handleAddRow}>
              {t('simulation.addLine')}
            </button>
          </div>

          <div className="simulation-field">
            <label>{t('simulation.nameLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('simulation.namePlaceholder')}
            />
          </div>

          {loading && (
            <div className="simulation-info">
              {t('simulation.loadingTitles')}
            </div>
          )}

          {!loading && error && (
            <div className="simulation-error">
              {error}
            </div>
          )}

          {!loading && !error && titleOptions.length === 0 && (
            <div className="simulation-warning">
              {t('simulation.emptyTitles')}
            </div>
          )}

          <div className="simulation-rows">
            {rows.map((row) => (
              <div key={row.id} className="simulation-row">
                <div className="simulation-field">
                  <label>{t('simulation.titleLabel')}</label>
                  <div className="title-suggest">
                    <input
                      type="text"
                      value={row.titleText}
                      onChange={(e) => handleTitleTextChange(row.id, e.target.value)}
                      onFocus={() => setActiveRowId(row.id)}
                      onBlur={() => {
                        setTimeout(() => {
                          setActiveRowId((current) => (current === row.id ? null : current));
                        }, 150);
                      }}
                      placeholder={t('simulation.selectTitle')}
                      disabled={loading || !!error}
                      autoComplete="off"
                    />
                    {activeRowId === row.id && (
                      <div className="title-suggest-list">
                        {getFilteredOptions(row.titleText).map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className="title-suggest-item"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleTitleSelect(row.id, option);
                            }}
                          >
                            <span className="title-suggest-label">{option.label}</span>
                          </button>
                        ))}
                        {getFilteredOptions(row.titleText).length === 0 && (
                          <div className="title-suggest-empty">
                            {t('simulation.noResults')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="simulation-field simulation-ratio">
                  <label>{t('simulation.ratioLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={row.ratio}
                    onChange={(e) => handleRowChange(row.id, 'ratio', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="simulation-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length === 1}
                  >
                    {t('simulation.removeLine')}
                  </button>
                </div>
              </div>
            ))}
          </div>


          <div className="simulation-total">
            <span>{t('simulation.totalLabel')}</span>
            <strong>{totalRatio.toFixed(2)}%</strong>
          </div>
          <div className={isTotalValid ? 'simulation-ok' : 'simulation-warning'}>
            {isTotalValid ? t('simulation.totalOk') : t('simulation.totalNotOk')}
          </div>
          {hasDuplicates && (
            <div className="simulation-warning">
              {t('simulation.duplicateTitles')}
            </div>
          )}
          {hasMissingFields && (
            <div className="simulation-warning">
              {t('simulation.missingFields')}
            </div>
          )}

          {statusMessage && (
            <div className={`message ${statusMessage.type === 'success' ? 'success' : 'error'}`}>
              {statusMessage.text}
            </div>
          )}

          <div className="simulation-footer">
            <button className="btn btn-primary" disabled={!isValid || saving} onClick={handleSave}>
              {saving
                ? t('simulation.saving')
                : (editingId ? t('simulation.updateTarget') : t('simulation.createTarget'))}
            </button>
            {editingId && (
              <button className="btn btn-secondary" onClick={handleCancelEdit}>
                {t('simulation.cancelEdit')}
              </button>
            )}
          </div>
        </div>

        <div className="simulation-card">
          <div className="simulation-header">
            <h2>{t('simulation.savedTitle')}</h2>
            <button className="btn btn-secondary" onClick={fetchPortfolios}>
              {t('simulation.refresh')}
            </button>
          </div>

          {portfoliosLoading && (
            <div className="simulation-info">
              {t('simulation.loadingPortfolios')}
            </div>
          )}

          {!portfoliosLoading && portfoliosError && (
            <div className="simulation-error">
              {portfoliosError}
            </div>
          )}

          {!portfoliosLoading && !portfoliosError && portfolios.length === 0 && (
            <div className="simulation-warning">
              {t('simulation.emptyPortfolios')}
            </div>
          )}

          <div className="portfolio-list">
            {portfolios.map((portfolio) => {
              const total = (portfolio.items || []).reduce(
                (sum, item) => sum + (parseFloat(item.ratio) || 0),
                0
              );
              return (
                <div key={portfolio.id} className="portfolio-card">
                  <div className="portfolio-card-header">
                    <div>
                      <h3>{portfolio.name}</h3>
                      <div className="portfolio-total">{total.toFixed(2)}%</div>
                    </div>
                    <div className="portfolio-actions">
                      <Link className="btn btn-success" to={`/analysis/${portfolio.id}`}>
                        {t('simulation.analyze')}
                      </Link>
                      <button className="btn btn-primary" onClick={() => handleEdit(portfolio)}>
                        {t('simulation.edit')}
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDelete(portfolio.id)}>
                        {t('simulation.delete')}
                      </button>
                    </div>
                  </div>
                  <div className="portfolio-items">
                    {(portfolio.items || []).map((item) => (
                      <div key={item.id} className="portfolio-item">
                        <span>
                          {titleMap.get(String(item.signaletique)) || `#${item.signaletique}`}
                        </span>
                        <strong>{parseFloat(item.ratio).toFixed(2)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>
    </div>
  );
}

export default Simulation;
