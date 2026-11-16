import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    FolderOpen,
    Building2,
    ArrowRight,
    RefreshCw,
    FileText,
    CalendarDays,
    Activity,
    AlertCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import dossierService from '../../services/dossierService';
import apiClient from '../../services/api';

const unwrapResponse = (response) => {
    let data = response?.data ?? response;

    if (data && !Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data;
    }

    return data;
};

const normalizeList = (response) => {
    const data = unwrapResponse(response);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.content)) return data.content;

    return [];
};

const formatDate = (value) => {
    if (!value) return 'Date non disponible';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Date non disponible';
    }

    return date.toLocaleDateString('fr-FR');
};

const getDossierName = (dossier) =>
    dossier?.nomDossier ||
    dossier?.reference ||
    `Dossier #${dossier?.id ?? dossier?.dossierId ?? '-'}`;

const AdminDashboard = () => {
    const { user } = useAuth();

    const [dossiers, setDossiers] = useState([]);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAdminData = async () => {
        if (!user) {
            setDossiers([]);
            setUsers([]);
            setDepartments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        const results = await Promise.allSettled([
            dossierService.getDossiers(user),
            userService.getAll(),
            apiClient.get('/departements'),
        ]);

        const [dossiersResult, usersResult, departmentsResult] = results;

        if (dossiersResult.status === 'fulfilled') {
            setDossiers(
                Array.isArray(dossiersResult.value)
                    ? dossiersResult.value
                    : []
            );
        } else {
            console.error(
                'Erreur chargement dossiers Admin:',
                dossiersResult.reason
            );
            setDossiers([]);
        }

        if (usersResult.status === 'fulfilled') {
            setUsers(normalizeList(usersResult.value));
        } else {
            console.error(
                'Erreur chargement utilisateurs Admin:',
                usersResult.reason
            );
            setUsers([]);
        }

        if (departmentsResult.status === 'fulfilled') {
            setDepartments(normalizeList(departmentsResult.value));
        } else {
            console.error(
                'Erreur chargement départements Admin:',
                departmentsResult.reason
            );
            setDepartments([]);
        }

        if (results.every((result) => result.status === 'rejected')) {
            setError(
                'Impossible de charger les données de l’administration.'
            );
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchAdminData();
    }, [user]);

    const activeDepartments = departments.filter(
        (department) =>
            department?.actif === 1 ||
            department?.actif === true ||
            department?.actif === '1'
    );

    const inactiveDepartments = departments.length - activeDepartments.length;

    const recentDossiers = [...dossiers]
        .sort((a, b) => {
            const dateA = new Date(a?.dateCreation || 0).getTime();
            const dateB = new Date(b?.dateCreation || 0).getTime();

            return dateB - dateA;
        })
        .slice(0, 5);

    const fullName =
        user?.name ||
        [user?.prenom, user?.nom].filter(Boolean).join(' ') ||
        user?.email ||
        'Administrateur';

    const statCards = [
        {
            title: 'Total des dossiers',
            value: dossiers.length,
            icon: FolderOpen,
            color: '#2563eb',
            background: '#eff6ff',
        },
        {
            title: 'Utilisateurs',
            value: users.length,
            icon: Users,
            color: '#7c3aed',
            background: '#f5f3ff',
        },
        {
            title: 'Départements actifs',
            value: activeDepartments.length,
            description: `${inactiveDepartments} département(s) inactif(s)`,
            icon: Building2,
            color: '#059669',
            background: '#ecfdf5',
        },
    ];

    const quickLinks = [
        {
            title: 'Gestion des utilisateurs',
            icon: Users,
            path: '/admin/utilisateurs',
            color: '#7c3aed',
            background: '#f5f3ff',
        },
        {
            title: 'Consultation des dossiers',
            icon: FolderOpen,
            path: '/admin/dossiers',
            color: '#2563eb',
            background: '#eff6ff',
        },
        {
            title: 'Gestion des départements',
            icon: Building2,
            path: '/admin/departements',
            color: '#059669',
            background: '#ecfdf5',
        },
    ];

    return (
        <div style={styles.page}>
            {/* En-tête */}
            <div style={styles.header}>
                <div>
                    <div style={styles.eyebrow}>
                        <Activity size={15} />
                        ESPACE ADMINISTRATION
                    </div>

                    <h1 style={styles.title}>
                        Administration MAWDY
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={fetchAdminData}
                    disabled={loading}
                    style={styles.refreshButton}
                >
                    <RefreshCw
                        size={16}
                        style={{
                            animation: loading
                                ? 'mawdy-spin 1s linear infinite'
                                : 'none',
                        }}
                    />
                    Actualiser
                </button>
            </div>

            {/* Erreur */}
            {error && (
                <div style={styles.error}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Statistiques */}
            <section style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={styles.sectionTitle}>
                            Vue générale
                        </h2>
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                style={styles.statCard}
                            >
                                <div style={styles.statTop}>
                                    <div
                                        style={{
                                            ...styles.statIcon,
                                            background: card.background,
                                            color: card.color,
                                        }}
                                    >
                                        <Icon size={23} />
                                    </div>

                                    <span style={styles.statLabel}>
                                        {card.title}
                                    </span>
                                </div>

                                <div style={styles.statValue}>
                                    {loading ? '...' : card.value}
                                </div>

                                {card.description && (
                                    <p style={styles.statDescription}>
                                        {card.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Raccourcis */}
            <section style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={styles.sectionTitle}>
                            Administration
                        </h2>
                    </div>
                </div>

                <div style={styles.linksGrid}>
                    {quickLinks.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={styles.linkCard}
                            >
                                <div
                                    style={{
                                        ...styles.linkIcon,
                                        color: item.color,
                                        background: item.background,
                                    }}
                                >
                                    <Icon size={25} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={styles.linkTitle}>
                                        {item.title}
                                    </h3>
                                </div>

                                <ArrowRight
                                    size={19}
                                    color="#94a3b8"
                                />
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Derniers dossiers */}
            <section style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={styles.sectionTitle}>
                            Derniers dossiers
                        </h2>
                    </div>

                    <Link
                        to="/admin/dossiers"
                        style={styles.viewAll}
                    >
                        Voir tous les dossiers
                        <ArrowRight size={16} />
                    </Link>
                </div>

                <div style={styles.tableContainer}>
                    {loading ? (
                        <div style={styles.emptyState}>
                            Chargement des dossiers...
                        </div>
                    ) : recentDossiers.length === 0 ? (
                        <div style={styles.emptyState}>
                            <FileText
                                size={30}
                                color="#94a3b8"
                            />
                            <p>Aucun dossier disponible.</p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Dossier</th>
                                <th style={styles.th}>Département actuel</th>
                                <th style={styles.th}>Date de création</th>
                            </tr>
                            </thead>

                            <tbody>
                            {recentDossiers.map((dossier, index) => (
                                <tr key={dossier.id ?? dossier.dossierId ?? index}>
                                    <td style={styles.td}>
                                        <div style={styles.dossierName}>
                                            <FileText
                                                size={17}
                                                color="#64748b"
                                            />
                                            {getDossierName(dossier)}
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        {dossier.nomDepartementActuel ||
                                            'Non renseigné'}
                                    </td>

                                    <td style={styles.td}>
                                            <span style={styles.date}>
                                                <CalendarDays size={15} />
                                                {formatDate(dossier.dateCreation)}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            <p style={styles.footerNote}>
                <Activity size={15} />
                Espace de supervision : les décisions métier sur les dossiers
                restent réservées aux services concernés.
            </p>

            <style>
                {`
                    @keyframes mawdy-spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @media (max-width: 700px) {
                        .admin-dashboard-header {
                            flex-direction: column;
                        }
                    }
                `}
            </style>
        </div>
    );
};

const styles = {
    page: {
        padding: '1.5rem',
        maxWidth: '1500px',
        margin: '0 auto',
        color: '#1e293b',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#fff',
        border: '1px solid #e8edf3',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '1.75rem',
    },
    eyebrow: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        color: '#dc2626',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        marginBottom: '0.7rem',
    },
    title: {
        fontSize: '1.7rem',
        fontWeight: 750,
        margin: '0 0 0.5rem',
        color: '#172033',
    },
    subtitle: {
        color: '#64748b',
        margin: 0,
        lineHeight: 1.6,
        fontSize: '0.93rem',
    },
    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        color: '#334155',
        padding: '0.7rem 1rem',
        borderRadius: '9px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    error: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '1rem',
        borderRadius: '10px',
        background: '#fef2f2',
        color: '#b91c1c',
        marginBottom: '1.5rem',
    },
    section: {
        marginBottom: '1.8rem',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem',
    },
    sectionTitle: {
        fontSize: '1.15rem',
        fontWeight: 700,
        margin: '0 0 0.35rem',
        color: '#1e293b',
    },
    sectionDescription: {
        fontSize: '0.86rem',
        color: '#64748b',
        margin: 0,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
    },
    statCard: {
        background: '#fff',
        border: '1px solid #e8edf3',
        borderRadius: '14px',
        padding: '1.25rem',
    },
    statTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
    },
    statIcon: {
        width: '45px',
        height: '45px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: '0.9rem',
        color: '#475569',
        fontWeight: 600,
    },
    statValue: {
        fontSize: '2rem',
        fontWeight: 750,
        color: '#172033',
        marginTop: '1.1rem',
    },
    statDescription: {
        color: '#94a3b8',
        fontSize: '0.82rem',
        margin: '0.35rem 0 0',
    },
    linksGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
    },
    linkCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        background: '#fff',
        border: '1px solid #e8edf3',
        borderRadius: '14px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
    },
    linkIcon: {
        width: '48px',
        height: '48px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
    },
    linkTitle: {
        fontSize: '0.95rem',
        fontWeight: 700,
        margin: '0 0 0.4rem',
        color: '#1e293b',
    },
    linkDescription: {
        fontSize: '0.81rem',
        lineHeight: 1.5,
        color: '#64748b',
        margin: 0,
    },
    viewAll: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        textDecoration: 'none',
        color: '#dc2626',
        fontSize: '0.85rem',
        fontWeight: 600,
    },
    tableContainer: {
        background: '#fff',
        border: '1px solid #e8edf3',
        borderRadius: '14px',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '600px',
    },
    th: {
        textAlign: 'left',
        padding: '1rem',
        background: '#f8fafc',
        color: '#64748b',
        fontSize: '0.78rem',
        fontWeight: 700,
        borderBottom: '1px solid #e8edf3',
    },
    td: {
        padding: '1rem',
        fontSize: '0.86rem',
        color: '#475569',
        borderBottom: '1px solid #f1f5f9',
    },
    dossierName: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        fontWeight: 600,
        color: '#334155',
    },
    date: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        color: '#64748b',
    },
    emptyState: {
        minHeight: '130px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#64748b',
        fontSize: '0.9rem',
    },
    footerNote: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#94a3b8',
        fontSize: '0.8rem',
        marginTop: '1.5rem',
    },
};

export default AdminDashboard;