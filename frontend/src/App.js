import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import Home from './components/Home';
import Admin from './components/Admin';
import ImportData from './components/ImportData';
import SignaletiqueList from './components/SignaletiqueList';
import Simulation from './components/Simulation';
import Analysis from './components/Analysis';
import Portfolios from './components/Portfolios';
import TransactionsList from './components/TransactionsList';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SuperUserRoute from './components/SuperUserRoute';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/admin-panel" element={<SuperUserRoute><AdminPanel /></SuperUserRoute>} />
              <Route path="/portfolios" element={<ProtectedRoute><Portfolios /></ProtectedRoute>} />
              <Route path="/portfolios/:portfolioId" element={<ProtectedRoute><TransactionsList /></ProtectedRoute>} />
              <Route path="/simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
              <Route path="/analysis/:id" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
              <Route path="/signaletique" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/signaletique/import" element={<ProtectedRoute><ImportData /></ProtectedRoute>} />
              <Route path="/signaletique/data" element={<ProtectedRoute><SignaletiqueList /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
