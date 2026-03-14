import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

const API = () => window.location.origin.replace(':3001', ':8001');

/* ─── petits utilitaires ─────────────────────────────────── */
function Badge({ children, color }) {
  const colors = {
    manual: '#8e44ad', koala: '#2980b9', bonobo: '#27ae60', import: '#e67e22',
  };
  return (
    <span style={{
      background: colors[color] || '#7f8c8d', color: '#fff',
      borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function fmt(num) {
  if (num == null) return '—';
  return Number(num).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

/* ─── formulaire d'entrée ────────────────────────────────── */
function EntryForm({ isin, entry, onSaved, onCancel }) {
  const [form, setForm] = useState({
    date: entry?.date || '',
    cours: entry?.cours ?? '',
    devise: entry?.devise || 'EUR',
    source: entry?.source || 'manual',
    symbole: entry?.symbole || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, cours: parseFloat(form.cours) };
      if (entry?.id) body.id = entry.id;

      const url = entry?.id
        ? `${API()}/api/prix-historique/${isin}/entries/${encodeURIComponent(entry.id)}/`
        : `${API()}/api/prix-historique/${isin}/entries/`;
      const method = entry?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur'); return; }
      onSaved(data.entry);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    padding: '6px 10px', borderRadius: 6,
    border: '1px solid #ccc', fontSize: 14, width: '100%', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 13, color: '#555', marginBottom: 3, display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8,
      padding: 20, marginBottom: 16,
    }}>
      <h4 style={{ margin: '0 0 16px', color: '#2c3e50' }}>
        {entry?.id ? '✏️ Modifier l\'entrée' : '➕ Nouvelle entrée de prix'}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" required value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Cours *</label>
          <input type="number" step="any" required value={form.cours}
            onChange={e => set('cours', e.target.value)} style={inputStyle} placeholder="ex: 42.50" />
        </div>
        <div>
          <label style={labelStyle}>Devise</label>
          <input value={form.devise} onChange={e => set('devise', e.target.value)} style={inputStyle} placeholder="EUR" />
        </div>
        <div>
          <label style={labelStyle}>Source</label>
          <select value={form.source} onChange={e => set('source', e.target.value)} style={inputStyle}>
            <option value="manual">manual</option>
            <option value="koala">koala</option>
            <option value="bonobo">bonobo</option>
            <option value="import">import</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Symbole</label>
          <input value={form.symbole} onChange={e => set('symbole', e.target.value)} style={inputStyle} placeholder="optionnel" />
        </div>
      </div>
      {error && <p style={{ color: '#e74c3c', margin: '8px 0' }}>❌ {error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={{
          background: '#2980b9', color: '#fff', border: 'none',
          borderRadius: 6, padding: '8px 20px', cursor: saving ? 'wait' : 'pointer', fontWeight: 600,
        }}>
          {saving ? '⏳ Enregistrement...' : (entry?.id ? '💾 Mettre à jour' : '➕ Ajouter')}
        </button>
        <button type="button" onClick={onCancel} style={{
          background: '#95a5a6', color: '#fff', border: 'none',
          borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
        }}>Annuler</button>
      </div>
    </form>
  );
}

/* ─── panneau d'import Excel ─────────────────────────────── */
function ImportPanel({ isin, onImported }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API()}/api/prix-historique/${isin}/import/`, {
        method: 'POST', credentials: 'include', body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg(`✅ ${data.ajoutes} entrée(s) importée(s), ${data.ignores} ignorée(s)`);
        setFile(null);
        onImported();
      } else {
        setMsg(`❌ ${data.error || 'Erreur'}`);
      }
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{
      background: '#eaf4fb', border: '1px solid #aed6f1', borderRadius: 8,
      padding: 16, marginBottom: 16,
    }}>
      <h4 style={{ margin: '0 0 10px', color: '#1a5276' }}>📥 Importer depuis Excel</h4>
      <p style={{ fontSize: 13, color: '#555', margin: '0 0 10px' }}>
        Colonnes attendues : <strong>Date</strong>, <strong>Cours</strong>, Devise, Source, Symbole
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept=".xlsx,.xls"
          onChange={e => { setFile(e.target.files[0]); setMsg(''); }}
          style={{ fontSize: 13 }} />
        <button onClick={handleImport} disabled={!file || importing} style={{
          background: '#1a5276', color: '#fff', border: 'none',
          borderRadius: 6, padding: '7px 16px', cursor: (!file || importing) ? 'not-allowed' : 'pointer',
          fontWeight: 600, fontSize: 13,
        }}>
          {importing ? '⏳ Import...' : '📥 Importer'}
        </button>
      </div>
      {msg && <p style={{ margin: '8px 0 0', fontWeight: 600, color: msg.startsWith('✅') ? '#1a5276' : '#e74c3c' }}>{msg}</p>}
    </div>
  );
}

/* ─── tableau historique d'un titre ─────────────────────── */
function TitreDetail({ isin, onBack, initialTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'historique'); // 'historique' | 'ajouter' | 'importer'
  const [editEntry, setEditEntry] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API()}/api/prix-historique/${isin}/`, { credentials: 'include' });
      if (res.status === 404) { setData({ historique: [], nom: isin, devise_ref: 'EUR' }); }
      else { setData(await res.json()); }
    } catch { setData({ historique: [], nom: isin, devise_ref: 'EUR' }); }
    finally { setLoading(false); }
  }, [isin]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (entry) => {
    if (!window.confirm(`Supprimer le cours du ${entry.date} (${fmt(entry.cours)} ${entry.devise}) ?`)) return;
    const res = await fetch(
      `${API()}/api/prix-historique/${isin}/delete-entry/${encodeURIComponent(entry.id)}/`,
      { method: 'DELETE', credentials: 'include' }
    );
    if (res.ok) { setDeleteMsg('✅ Entrée supprimée'); load(); setTimeout(() => setDeleteMsg(''), 3000); }
    else { setDeleteMsg('❌ Erreur lors de la suppression'); }
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setActiveTab('ajouter');
  };

  const sortedHistory = data
    ? [...(data.historique || [])].sort((a, b) => (b.date || '') < (a.date || '') ? -1 : 1)
    : [];

  if (loading) return <p>⏳ Chargement...</p>;

  const tabStyle = (name) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: activeTab === name ? '3px solid #2980b9' : '3px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: activeTab === name ? 700 : 400,
    color: activeTab === name ? '#2980b9' : '#555',
    fontSize: 15,
  });

  return (
    <div>
      {/* En-tête */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#2980b9', cursor: 'pointer',
        fontSize: 15, marginBottom: 12, padding: 0,
      }}>← Retour à la liste</button>

      <div style={{ marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>{data?.nom || isin}</h2>
        <span style={{ color: '#7f8c8d', fontSize: 14 }}>{isin} — devise réf. {data?.devise_ref || 'EUR'} — {sortedHistory.length} entrée(s)</span>
      </div>

      {/* Onglets */}
      <div style={{ borderBottom: '1px solid #dee2e6', marginTop: 16, marginBottom: 20, display: 'flex', gap: 4 }}>
        <button style={tabStyle('historique')} onClick={() => { setActiveTab('historique'); setEditEntry(null); }}>
          📋 Historique
        </button>
        <button style={tabStyle('ajouter')} onClick={() => setActiveTab('ajouter')}>
          ✏️ {editEntry ? 'Modifier l\'entrée' : 'Ajouter un prix'}
        </button>
        <button style={tabStyle('importer')} onClick={() => { setActiveTab('importer'); setEditEntry(null); }}>
          📥 Importer Excel
        </button>
      </div>

      {deleteMsg && (
        <p style={{ color: deleteMsg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontWeight: 600, marginBottom: 12 }}>
          {deleteMsg}
        </p>
      )}

      {/* ── Onglet Historique ── */}
      {activeTab === 'historique' && (
        sortedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#7f8c8d' }}>
            <p style={{ fontSize: 16 }}>Aucune entrée de prix pour ce titre.</p>
            <p>Utilisez l'onglet <strong>Ajouter un prix</strong> ou <strong>Importer Excel</strong>.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#2c3e50', color: '#fff' }}>
                  <th style={th}>Date</th>
                  <th style={{ ...th, textAlign: 'right' }}>Cours</th>
                  <th style={th}>Devise</th>
                  <th style={th}>Source</th>
                  <th style={th}>Symbole</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((entry, i) => (
                  <tr key={entry.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td style={td}>{entry.date}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(entry.cours)}</td>
                    <td style={td}>{entry.devise}</td>
                    <td style={td}><Badge color={entry.source}>{entry.source}</Badge></td>
                    <td style={{ ...td, color: '#7f8c8d' }}>{entry.symbole || '—'}</td>
                    <td style={td}>
                      <button onClick={() => handleEdit(entry)} title="Modifier"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginRight: 6 }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(entry)} title="Supprimer"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Onglet Ajouter / Modifier ── */}
      {activeTab === 'ajouter' && (
        <EntryForm
          isin={isin}
          entry={editEntry}
          onSaved={() => { setEditEntry(null); load(); setActiveTab('historique'); }}
          onCancel={() => { setEditEntry(null); setActiveTab('historique'); }}
        />
      )}

      {/* ── Onglet Importer ── */}
      {activeTab === 'importer' && (
        <ImportPanel isin={isin} onImported={() => { load(); setActiveTab('historique'); }} />
      )}
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' };
const td = { padding: '8px 12px', borderBottom: '1px solid #ecf0f1' };

/* ─── liste de tous les titres ───────────────────────────── */
function TitreList({ onSelect }) {
  const [titres, setTitres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newIsin, setNewIsin] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`${API()}/api/prix-historique/`, { credentials: 'include' })
      .then(r => r.json())
      .then(setTitres)
      .catch(() => setTitres([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = titres.filter(t =>
    (t.isin + ' ' + t.nom).toLowerCase().includes(search.toLowerCase())
  );

  const handleNewIsin = () => {
    const isin = newIsin.trim().toUpperCase();
    if (!isin) return;
    setCreating(false);
    setNewIsin('');
    onSelect(isin, 'ajouter');
  };

  if (loading) return <p>⏳ Chargement...</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Rechercher ISIN ou nom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
        />
        {creating ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus
              placeholder="ISIN (ex: FR0010149179)"
              value={newIsin}
              onChange={e => setNewIsin(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNewIsin(); if (e.key === 'Escape') setCreating(false); }}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #27ae60', fontSize: 14, width: 200 }}
            />
            <button onClick={handleNewIsin} style={{
              background: '#27ae60', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 600,
            }}>Ouvrir</button>
            <button onClick={() => setCreating(false)} style={{
              background: '#95a5a6', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 12px', cursor: 'pointer',
            }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} style={{
            background: '#27ae60', color: '#fff', border: 'none',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
          }}>
            ➕ Nouveau titre
          </button>
        )}
      </div>

      {!search && titres.length > 0 && (
        <p style={{ fontSize: 13, color: '#7f8c8d', margin: '0 0 12px' }}>
          👆 Cliquez sur un titre pour voir son historique ou ajouter des prix.
        </p>
      )}

      {filtered.length === 0 ? (
        <p style={{ color: '#7f8c8d' }}>
          {search ? 'Aucun résultat.' : 'Aucun historique de prix enregistré. Commencez par créer un titre.'}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#2c3e50', color: '#fff' }}>
                <th style={th}>ISIN</th>
                <th style={th}>Nom</th>
                <th style={{ ...th, textAlign: 'right' }}>Dernier cours</th>
                <th style={th}>Dernière date</th>
                <th style={{ ...th, textAlign: 'right' }}>Nb entrées</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.isin}
                  onClick={() => onSelect(t.isin)}
                  style={{
                    background: i % 2 === 0 ? '#fff' : '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eaf4fb'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f8f9fa'}
                >
                  <td style={{ ...td, fontFamily: 'monospace', fontWeight: 600, color: '#2980b9' }}>{t.isin}</td>
                  <td style={td}>{t.nom}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                    {t.dernier_cours != null ? fmt(t.dernier_cours) : '—'}
                  </td>
                  <td style={td}>{t.derniere_date || '—'}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#7f8c8d' }}>{t.nb_entrees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── composant principal ────────────────────────────────── */
export default function PrixHistorique() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isinParam = params.get('isin');

  const [selectedIsin, setSelectedIsin] = useState(isinParam || null);
  const [openTab, setOpenTab] = useState(isinParam ? 'ajouter' : 'historique');

  const handleSelect = (isin, tab = 'historique') => {
    setSelectedIsin(isin);
    setOpenTab(tab);
  };

  return (
    <div className="App" style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Entête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50' }}>📈 Historique des prix</h1>
            <p style={{ margin: '4px 0 0', color: '#7f8c8d', fontSize: 14 }}>
              Cliquez sur un titre pour consulter, ajouter ou modifier ses cours historiques
            </p>
          </div>
          <Link to="/" style={{ color: '#2980b9', textDecoration: 'none', fontSize: 14 }}>
            ← Accueil
          </Link>
        </div>

        {/* Contenu */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        }}>
          {selectedIsin ? (
            <TitreDetail isin={selectedIsin} initialTab={openTab} onBack={() => setSelectedIsin(null)} />
          ) : (
            <TitreList onSelect={handleSelect} />
          )}
        </div>
      </div>
    </div>
  );
}
