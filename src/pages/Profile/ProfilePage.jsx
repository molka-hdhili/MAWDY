
import React from 'react';

import {
    User,
    Shield,
    Building2,
    Mail,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import {
    isReception,
    isFinance,
    isAdmin,
} from '../../utils/permissions';

import { ROLE_LABELS } from '../../utils/constants';

import {
    Card,
    CardHeader,
    CardBody,
} from '../../components/common/Card';

// =====================================================
// PAGE PROFIL
// =====================================================

export const ProfilePage = () => {
    const { user } = useAuth();

    // ===================================================
    // IDENTIFICATION DE L'UTILISATEUR
    // ===================================================

    const estReception = isReception(user);
    const estFinance = isFinance(user);
    const estAdmin = isAdmin(user);

    const fullName =
        user?.name ||
        [user?.prenom, user?.nom].filter(Boolean).join(' ') ||
        'Utilisateur';

    const department =
        user?.department ||
        user?.departementName ||
        'Non affecté';

    const role =
        ROLE_LABELS?.[user?.role] ||
        user?.roleName ||
        user?.role ||
        'Utilisateur';

    const email = user?.email || 'Non renseigné';

    const avatar = user?.avatar || 'US';

    // ===================================================
    // MATRICE DES HABILITATIONS
    // ===================================================
    // Cette matrice présente les règles générales.
    // L'autorisation réelle dépend aussi du dossier,
    // de son département et de son statut côté backend.

    const permissionsList = [
        {
            label: 'Créer un nouveau dossier',
            allowed: estReception,
            condition: 'Réservé au département Réception',
        },
        {
            label: 'Déposer les documents initiaux',
            allowed: estReception,
            condition: 'Réception : dépôt des documents uniquement',
        },
        {
            label: 'Prendre une décision métier',
            allowed: !estReception && !estAdmin,
            condition: 'Utilisateur métier autorisé sur un dossier affecté',
        },
        {
            label: 'Traiter les paiements',
            allowed: estFinance,
            condition: 'Réservé au département Finance',
        },
        {
            label: 'Consulter l’historique métier',
            allowed: !estReception,
            condition: 'Non accessible au département Réception',
        },
        {
            label: 'Gérer les comptes utilisateurs',
            allowed: estAdmin,
            condition: 'Réservé à l’administrateur',
        },
        {
            label: 'Gérer les rôles et départements',
            allowed: estAdmin,
            condition: 'Réservé à l’administrateur',
        },
    ];

    // ===================================================
    // AFFICHAGE
    // ===================================================

    return (
        <div
            style={{
                maxWidth: '960px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
            }}
        >

            {/* ============================================= */}
            {/* FICHE UTILISATEUR                             */}
            {/* ============================================= */}

            <Card>
                <CardBody style={{ padding: '2rem' }}>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            flexWrap: 'wrap',
                        }}
                    >

                        {/* Avatar */}
                        <div
                            style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: 'var(--color-primary)',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.8rem',
                                fontWeight: 800,
                                boxShadow: '0 4px 6px rgba(211, 18, 42, 0.25)',
                                flexShrink: 0,
                            }}
                        >
                            {avatar}
                        </div>

                        {/* Informations */}
                        <div style={{ flex: 1 }}>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <h2
                                    style={{
                                        fontSize: '1.35rem',
                                        fontWeight: 800,
                                        color: 'var(--color-text-main)',
                                    }}
                                >
                                    {fullName}
                                </h2>

                                <span
                                    style={{
                                        backgroundColor: 'var(--color-primary-light)',
                                        color: 'var(--color-primary)',
                                        padding: '0.2rem 0.65rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                    }}
                                >
                  {role}
                </span>
                            </div>

                            <p
                                style={{
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.9rem',
                                    marginTop: '0.25rem',
                                }}
                            >
                                Collaborateur MAWDY Enterprise
                            </p>

                            {/* Département et email */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    marginTop: '0.85rem',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.85rem',
                                    flexWrap: 'wrap',
                                }}
                            >

                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                    }}
                >
                  <Building2
                      size={15}
                      style={{ color: 'var(--color-primary)' }}
                  />

                  Département :
                  <strong>{department}</strong>
                </span>

                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                    }}
                                >
                  <Mail
                      size={15}
                      style={{ color: 'var(--color-primary)' }}
                  />

                                    {email}
                </span>

                            </div>

                            {/* Identifiant */}
                            <p
                                style={{
                                    marginTop: '0.65rem',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.8rem',
                                }}
                            >
                                Identifiant utilisateur : {user?.utilisateurId ?? 'Non disponible'}
                            </p>

                        </div>
                    </div>

                </CardBody>
            </Card>

            {/* ============================================= */}
            {/* HABILITATIONS                                 */}
            {/* ============================================= */}

            <Card>

                <CardHeader
                    title="Matrice des Habilitations & Droits Applicatifs"
                    subtitle="Consultation des autorisations associées à votre rôle et à votre département"
                />

                <CardBody style={{ padding: 0 }}>

                    <table className="data-table">

                        <thead>
                        <tr>
                            <th>Capacité métier</th>
                            <th>Condition d'accès</th>
                            <th style={{ textAlign: 'right' }}>
                                Votre statut
                            </th>
                        </tr>
                        </thead>

                        <tbody>

                        {permissionsList.map((permission, index) => (
                            <tr key={index}>

                                <td style={{ fontWeight: 600 }}>
                                    {permission.label}
                                </td>

                                <td
                                    style={{
                                        color: 'var(--color-text-muted)',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {permission.condition}
                                </td>

                                <td style={{ textAlign: 'right' }}>

                                    {permission.allowed ? (
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                color: 'var(--color-emerald)',
                                                fontWeight: 700,
                                                fontSize: '0.8rem',
                                            }}
                                        >
                        <CheckCircle2 size={16} />
                        Autorisé
                      </span>
                                    ) : (
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                color: 'var(--color-text-muted)',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                        <XCircle size={16} />
                        Non habilité
                      </span>
                                    )}

                                </td>

                            </tr>
                        ))}

                        </tbody>

                    </table>

                </CardBody>
            </Card>

            {/* ============================================= */}
            {/* INFORMATIONS DE SÉCURITÉ                      */}
            {/* ============================================= */}

            <Card>

                <CardHeader
                    title="Sécurité et contrôle d'accès"
                    subtitle="Informations relatives à la protection de votre compte"
                />

                <CardBody>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem',
                        }}
                    >

                        <div
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Shield size={21} />
                        </div>

                        <div>
                            <h3
                                style={{
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    marginBottom: '0.35rem',
                                }}
                            >
                                Accès sécurisé
                            </h3>

                            <p
                                style={{
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.6,
                                }}
                            >
                                Vos accès sont déterminés par votre rôle et votre
                                département. Les opérations métier sont soumises
                                aux contrôles d'autorisation du backend MAWDY.
                                Les fichiers de signature restent réservés au
                                traitement interne du backend et ne sont pas
                                exposés dans votre profil.
                            </p>
                        </div>

                    </div>

                </CardBody>
            </Card>

        </div>
    );
};

export default ProfilePage;
