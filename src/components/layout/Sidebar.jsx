
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  History,
  PlusCircle,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import {
  isReception,
  isFinance,
  isAdmin,
} from '../../utils/permissions';

import { ROLE_LABELS } from '../../utils/constants';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Identification du rôle
  const estAdmin = isAdmin(user);
  const estReception = isReception(user);
  const estFinance = isFinance(user);

  // Déconnexion
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Construction des menus selon le rôle
  const navItems = [];

  if (estAdmin) {
    // MENU ADMINISTRATEUR
    navItems.push(
        {
          to: '/admin',
          label: 'Tableau de bord',
          icon: LayoutDashboard,
        },
        {
          to: '/admin/utilisateurs',
          label: 'Gestion des utilisateurs',
          icon: Users,
        },
        {
          to: '/admin/dossiers',
          label: 'Tous les dossiers',
          icon: FolderKanban,
        },
        {
          to: '/admin/departements',
          label: 'Départements',
          icon: Building2,
        }
    );
  } else {
    // MENU DES AUTRES UTILISATEURS
    navItems.push({
      to: '/dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    });

    // Seule la Réception peut créer un dossier
    if (estReception) {
      navItems.push({ to: '/dossiers/transmis', label: 'Dossiers transmis', icon: FolderKanban });
      navItems.push({
        to: '/dossiers/nouveau',
        label: 'Créer un dossier',
        icon: PlusCircle,
      });
    }

    // Répertoire des dossiers
    navItems.push({
      to: '/dossiers',
      label: estReception
          ? 'Dossiers actifs'
          : estFinance
              ? 'Dossiers Finance'
              : 'Dossiers reçus',
      icon: FolderKanban,
    });

    // Documents et factures
    navItems.push({
      to: '/documents',
      label: 'Factures',
      icon: FileText,
    });

    // Historique : non accessible à la Réception
    if (!estReception) {
      navItems.push({
        to: '/historique',
        label: 'Historique',
        icon: History,
      });
    }
  }

  // Profil personnel pour tous les rôles
  navItems.push({
    to: '/profil',
    label: 'Mon Profil',
    icon: User,
  });

  // Informations utilisateur
  const department =
      user?.department ||
      user?.departementName ||
      (estAdmin ? 'Administration' : 'Non affecté');

  const role =
      ROLE_LABELS?.[user?.role] ||
      user?.roleName ||
      user?.role ||
      'Utilisateur';

  const fullName =
      user?.name ||
      [user?.prenom, user?.nom].filter(Boolean).join(' ') ||
      user?.email ||
      'Utilisateur';

  const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  // Route du logo selon le rôle
  const homePath = estAdmin ? '/admin' : '/dashboard';

  return (
      <aside
          className={`sidebar ${collapsed ? 'collapsed' : ''}`}
          aria-label="Navigation principale"
      >
        {/* En-tête */}
        <div className="sidebar-header">
          <NavLink
              to={homePath}
              className="brand-link"
              title="MAWDY Enterprise"
          >
            <div className="brand-logo-badge">M</div>

            {!collapsed && (
                <div className="brand-text-wrapper">
                  <span className="brand-title">MAWDY</span>
                  <span className="brand-subtitle">
                Gestion Documentaire
              </span>
                </div>
            )}
          </NavLink>

          <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setCollapsed((previous) => !previous)}
              title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
              aria-label="Basculer l'affichage du menu latéral"
          >
            {collapsed ? (
                <ChevronRight size={18} />
            ) : (
                <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {!collapsed && (
              <div className="sidebar-section-label">
                {estAdmin ? 'ADMINISTRATION' : 'MENU PRINCIPAL'}
              </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                >
              <span className="nav-item-icon">
                <Icon size={19} />
              </span>

                  {!collapsed && (
                      <span className="nav-label">
                  {item.label}
                </span>
                  )}
                </NavLink>
            );
          })}
        </nav>

        {/* Pied de la sidebar */}
        <div className="sidebar-footer">
          {user && !collapsed && (
              <div className="sidebar-user-card">
                <div className="user-avatar-circle">
                  {user.avatar || initials || 'US'}
                </div>

                <div className="user-info-text">
                  <span className="user-name">{fullName}</span>

                  <span className="user-role-badge">
                {department} • {role}
              </span>
                </div>
              </div>
          )}

          {/* Déconnexion */}
          <button
              type="button"
              className="nav-item"
              onClick={handleLogout}
              title={collapsed ? 'Déconnexion' : undefined}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
          >
          <span
              className="nav-item-icon"
              style={{ color: 'var(--color-danger)' }}
          >
            <LogOut size={19} />
          </span>

            {!collapsed && (
                <span style={{ color: 'var(--color-danger)' }}>
              Déconnexion
            </span>
            )}
          </button>
        </div>
      </aside>
  );
};

export default Sidebar;
