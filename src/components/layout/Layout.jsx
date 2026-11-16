
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Tableau de bord',
  '/dossiers': 'Gestion des dossiers et factures',
  '/dossiers/nouveau': 'Création d’un nouveau dossier',
  '/documents': 'Gestion électronique des documents',
  '/historique': 'Historique et journal d’audit',
  '/notifications': 'Centre de notifications',
  '/profil': 'Profil utilisateur et habilitations',

  '/admin': 'Administration MAWDY',
  '/admin/utilisateurs': 'Gestion des utilisateurs',
  '/admin/dossiers': 'Consultation globale des dossiers',
  '/admin/departements': 'Gestion des départements'
};

const Layout = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  const currentPath = location.pathname;

  let currentTitle = PAGE_TITLES[currentPath] || 'MAWDY Enterprise';

  // Titre dynamique pour les détails d'un dossier.
  if (
      currentPath.startsWith('/dossiers/') &&
      currentPath !== '/dossiers/nouveau'
  ) {
    currentTitle = 'Fiche détail du dossier';
  }

  // Titre dynamique pour les pages Admin.
  if (currentPath.startsWith('/admin/')) {
    currentTitle =
        PAGE_TITLES[currentPath] || 'Administration MAWDY';
  }

  if (loading) {
    return (
        <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
        >
          Chargement de votre espace MAWDY...
        </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
      <div className="app-container">
        <Sidebar />

        <div className="main-wrapper">
          <Topbar title={currentTitle} />

          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
  );
};

export default Layout;
