import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../App.css';

function AdminPanel() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCategoriesFrame, setShowCategoriesFrame] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Formulaire utilisateur
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_staff: false,
    is_superuser: false,
    is_active: true
  });

  // Formulaire catégorie
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#4CAF50',
    ordre: 1
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8001/api/admin/users/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Gérer la pagination DRF - si c'est un objet paginé, extraire results
        const usersList = Array.isArray(data) ? data : (data.results || []);
        setUsers(usersList);
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8001/api/admin/categories/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Gérer la pagination DRF - si c'est un objet paginé, extraire results
        const categoriesList = Array.isArray(data) ? data : (data.results || []);
        setCategories(categoriesList);
      } else {
        setError('Erreur lors du chargement des catégories');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingUser
        ? `http://localhost:8001/api/admin/users/${editingUser.id}/`
        : 'http://localhost:8001/api/admin/users/';
      
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          is_staff: false,
          is_superuser: false,
          is_active: true
        });
        fetchUsers();
      } else {
        const data = await response.json();
        setError(JSON.stringify(data));
      }
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`http://localhost:8001/api/admin/users/${userId}/`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchUsers();
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_staff: false,
      is_superuser: false,
      is_active: true
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      is_active: user.is_active
    });
    setShowUserModal(true);
  };

  const handleOpenCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8001/api/admin/categories/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const categoriesList = Array.isArray(data) ? data : (data.results || []);
        setCategories(categoriesList);
        setShowCategoriesFrame(true);
      } else {
        setError('Erreur lors du chargement des catégories');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingCategory
        ? `http://localhost:8001/api/admin/categories/${editingCategory.id}/`
        : 'http://localhost:8001/api/admin/categories/';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm({
          name: '',
          description: '',
          color: '#4CAF50',
          ordre: 1
        });
        // Recharger les catégories
        handleOpenCategories();
      } else {
        const data = await response.json();
        setError(JSON.stringify(data));
      }
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    try {
      const response = await fetch(`http://localhost:8001/api/admin/categories/${categoryId}/`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        handleOpenCategories();
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      color: '#4CAF50',
      ordre: categories.length + 1
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      ordre: category.ordre
    });
    setShowCategoryModal(true);
  };

  return (
    <div className="App">
      <div className="admin-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn-back">← Retour</Link>
        <h1>🔧 Panneau d'Administration</h1>
        <div style={{ width: '100px' }}></div>
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      <div className="users-section">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestion des utilisateurs</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleOpenCategories}>
              📁 Catégories d'actifs
            </button>
            <button className="btn btn-primary" onClick={openAddUserModal}>
              + Nouvel utilisateur
            </button>
          </div>
        </div>

        {loading ? (
          <div>Chargement...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Nom complet</th>
                <th>Staff</th>
                <th>Superuser</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.is_staff ? '✓' : '✗'}</td>
                  <td>{user.is_superuser ? '✓' : '✗'}</td>
                  <td>{user.is_active ? '✓' : '✗'}</td>
                  <td>
                    <button className="btn btn-small" onClick={() => openEditUserModal(user)}>✏️</button>
                    {user.id !== 1 && (
                      <button className="btn btn-small btn-danger" onClick={() => handleDeleteUser(user.id)}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Frame Catégories d'actifs */}
      {showCategoriesFrame && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', color: '#333' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#333' }}>📁 Catégories d'actifs</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={openAddCategoryModal}>
                  + Nouvelle catégorie
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCategoriesFrame(false)}>
                  ← Retour
                </button>
              </div>
            </div>
            
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
              <thead>
                <tr>
                  <th style={{ color: 'white' }}>Nom</th>
                  <th style={{ color: 'white' }}>Description</th>
                  <th style={{ color: 'white' }}>Couleur</th>
                  <th style={{ color: 'white' }}>Ordre</th>
                  <th style={{ color: 'white' }}>Nb titres</th>
                  <th style={{ color: 'white' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      Aucune catégorie d'actifs
                    </td>
                  </tr>
                ) : (
                  categories.map(category => (
                    <tr key={category.id}>
                      <td style={{ color: '#333' }}><strong>{category.name}</strong></td>
                      <td style={{ color: '#666' }}>{category.description}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', backgroundColor: category.color, borderRadius: '4px', border: '1px solid #ddd' }}></div>
                          <span style={{ color: '#666' }}>{category.color}</span>
                        </div>
                      </td>
                      <td style={{ color: '#333' }}>{category.ordre}</td>
                      <td style={{ color: '#333' }}>{category.signaletiques_count || 0}</td>
                      <td>
                        <button className="btn btn-small" onClick={() => openEditCategoryModal(category)} style={{ marginRight: '5px', padding: '5px 10px', fontSize: '0.9rem' }}>✏️</button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDeleteCategory(category.id)} style={{ padding: '5px 10px', fontSize: '0.9rem' }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Utilisateur */}
      {showUserModal && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto', color: '#333' }}>
            <h2 style={{ color: '#333' }}>{editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h2>
            <form onSubmit={handleSaveUser}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Username * </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Prénom</label>
                <input
                  type="text"
                  value={userForm.first_name}
                  onChange={e => setUserForm({ ...userForm, first_name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Nom</label>
                <input
                  type="text"
                  value={userForm.last_name}
                  onChange={e => setUserForm({ ...userForm, last_name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Mot de passe {editingUser && '(laisser vide pour ne pas changer)'}</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  required={!editingUser}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', gap: '20px' }}>
                <label style={{ color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={userForm.is_staff}
                    onChange={e => setUserForm({ ...userForm, is_staff: e.target.checked })}
                  />
                  {' '}Staff
                </label>
                <label style={{ color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={userForm.is_superuser}
                    onChange={e => setUserForm({ ...userForm, is_superuser: e.target.checked })}
                  />
                  {' '}Superuser
                </label>
                <label style={{ color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })}
                  />
                  {' '}Actif
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Catégorie */}
      {showCategoryModal && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%', color: '#333' }}>
            <h2 style={{ color: '#333' }}>{editingCategory ? 'Modifier catégorie' : 'Nouvelle catégorie'}</h2>
            <form onSubmit={handleSaveCategory}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Nom *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Couleur</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Ordre d'affichage</label>
                <input
                  type="number"
                  value={categoryForm.ordre}
                  onChange={e => setCategoryForm({ ...categoryForm, ordre: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
