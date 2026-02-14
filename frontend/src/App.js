import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';
import Home from './components/Home';
import Admin from './components/Admin';
import ImportData from './components/ImportData';
import SignaletiqueList from './components/SignaletiqueList';
import Simulation from './components/Simulation';
import Analysis from './components/Analysis';
import Portfolios from './components/Portfolios';
import TransactionsList from './components/TransactionsList';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolios" element={<Portfolios />} />
            <Route path="/portfolios/:portfolioId" element={<TransactionsList />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/analysis/:id" element={<Analysis />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/import" element={<ImportData />} />
            <Route path="/admin/signaletique" element={<SignaletiqueList />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
