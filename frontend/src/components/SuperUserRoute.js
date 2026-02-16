import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function SuperUserRoute({ children }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    const checkSuperUser = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8001/api/admin/check-superuser/', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsSuperUser(data.is_superuser);
        }
      } catch (error) {
        console.error('Erreur vérification superuser:', error);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkSuperUser();
    }
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Vérification des permissions...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperUser) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '20px'
      }}>
        <h2>⛔ Accès refusé</h2>
        <p>Vous devez être un superutilisateur pour accéder à cette page.</p>
        <a href="/" className="btn btn-primary">Retour à l'accueil</a>
      </div>
    );
  }

  return children;
}

export default SuperUserRoute;
