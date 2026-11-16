
import React from 'react';
import { NavLink } from 'react-router-dom';

import {
    Building2,
    Shield,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';

export const Topbar = ({ title }) => {
    const { user } = useAuth();

    // Nom du rôle affiché
    const roleLabel =
        ROLE_LABELS?.[user?.role] ||
        user?.roleName ||
        'Utilisateur';

    return (
        <header className="topbar">

            {/* Titre de la page */}
            <div className="topbar-left">
                <h1 className="page-title">
                    {title}
                </h1>
            </div>

            <div className="topbar-right">

                {/* Département de l'utilisateur */}
                {user && (
                    <div
                        className="dept-tag"
                        title="Département affecté"
                    >
                        <Building2
                            size={15}
                            style={{ color: 'var(--color-primary)' }}
                        />

                        <span>
              {user.department || user.departementName || 'Non affecté'}
            </span>
                    </div>
                )}

                {/* Rôle de l'utilisateur */}
                {user && (
                    <div
                        className="dept-tag"
                        title="Rôle de l'utilisateur"
                    >
                        <Shield
                            size={15}
                            style={{ color: 'var(--color-primary)' }}
                        />

                        <span>
              {roleLabel}
            </span>
                    </div>
                )}

                {/* Profil */}
                {user && (
                    <NavLink
                        to="/profil"
                        title="Consulter mon profil"
                        aria-label="Consulter mon profil"
                    >
                        <div
                            className="user-avatar-circle"
                            style={{
                                width: '36px',
                                height: '36px',
                            }}
                        >
                            {user.avatar || 'US'}
                        </div>
                    </NavLink>
                )}

            </div>
        </header>
    );
};

export default Topbar;
