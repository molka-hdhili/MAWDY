import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../services/api';
import { STATUS_CONFIG } from '../../utils/constants';
import {
    Search,
    FolderOpen,
    Eye,
    RefreshCw,
    X,
    CalendarDays,
    Building2,
    UserRound,
    FileText,
    Archive,
    AlertCircle
} from 'lucide-react';

const COLORS = {
    primary: '#c62828',
    primaryLight: '#fff1f1',
    text: '#1e293b',
    muted: '#64748b',
    border: '#e2e8f0',
    background: '#f8fafc'
};

const formatDate = (date) => {
    if (!date) return 'Non renseignée';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Date invalide';
    }

    return parsedDate.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusStyle = (status) => {
    const value = (status || '').toUpperCase();

    if (['VALIDE', 'PAYE', 'ARCHIVE'].includes(value)) {
        return { background: '#dcfce7', color: '#166534' };
    }

    if (['REJETE'].includes(value)) {
        return { background: '#fee2e2', color: '#991b1b' };
    }

    if (['EN_ATTENTE_VALIDATION', 'RETOUR_CORRECTION'].includes(value)) {
        return { background: '#fef3c7', color: '#92400e' };
    }

    if (['TRANSMIS_FINANCE'].includes(value)) {
        return { background: '#dbeafe', color: '#1e40af' };
    }

    return { background: '#f1f5f9', color: '#475569' };
};

const getStatusLabel = (status) => {
    const value = String(status ?? '').toUpperCase();
    const config = Object.values(STATUS_CONFIG).find((item) => item.code === value);
    return config?.label || (value ? `Statut non référencé (${status})` : 'Statut non renseigné');
};

const AdminDossiersPage = () => {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('TOUS');
    const [selectedStatus, setSelectedStatus] = useState('TOUS');
    const [selectedDossier, setSelectedDossier] = useState(null);

    const loadDossiers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await apiClient.get('/dossiers');

            // Accepte une liste directe ou une liste enveloppée dans un objet.
            const data = response?.data ?? response;
            const list = Array.isArray(data)
                ? data
                : data?.dossiers ?? data?.content ?? data?.data ?? [];

            if (!Array.isArray(list)) {
                throw new Error('Le format de la réponse du serveur est invalide.');
            }

            setDossiers(list);
        } catch (err) {
            console.error('Erreur chargement dossiers :', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Impossible de charger les dossiers.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDossiers();
    }, []);

    const departments = useMemo(() => {
        return [
            ...new Set(
                dossiers
                    .flatMap((dossier) => [
                        dossier.departementOrigine,
                        dossier.departementActuel
                    ])
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, 'fr'));
    }, [dossiers]);

    const statuses = useMemo(() => {
        return [
            ...new Set(
                dossiers
                    .map((dossier) => dossier.statut)
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, 'fr'));
    }, [dossiers]);

    const filteredDossiers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return dossiers.filter((dossier) => {
            const matchesSearch =
                !term ||
                [
                    dossier.dossierId,
                    dossier.nomDossier,
                    dossier.description,
                    dossier.departementOrigine,
                    dossier.departementActuel,
                    dossier.creePar
                ].some((value) =>
                    String(value ?? '').toLowerCase().includes(term)
                );

            const matchesDepartment =
                selectedDepartment === 'TOUS' ||
                dossier.departementOrigine === selectedDepartment ||
                dossier.departementActuel === selectedDepartment;

            const matchesStatus =
                selectedStatus === 'TOUS' ||
                dossier.statut === selectedStatus;

            return matchesSearch && matchesDepartment && matchesStatus;
        });
    }, [dossiers, search, selectedDepartment, selectedStatus]);

    const stats = useMemo(() => ({
        total: dossiers.length,
        active: dossiers.filter(
            (d) => !['ARCHIVE'].includes((d.statut || '').toUpperCase())
        ).length,
        archived: dossiers.filter(
            (d) =>
                (d.statut || '').toUpperCase() === 'ARCHIVE' ||
                (d.archive || '').toUpperCase() === 'OUI'
        ).length
    }), [dossiers]);

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <div style={styles.breadcrumb}>Administration / Dossiers</div>
                    <h1 style={styles.title}>Consultation des dossiers</h1>
                </div>

                <button
                    type="button"
                    onClick={loadDossiers}
                    disabled={loading}
                    style={styles.refreshButton}
                >
                    <RefreshCw size={17} />
                    Actualiser
                </button>
            </div>

            <div style={styles.statsGrid}>
                <StatCard
                    icon={<FolderOpen size={22} />}
                    label="Total des dossiers"
                    value={stats.total}
                />
                <StatCard
                    icon={<FileText size={22} />}
                    label="Dossiers non archivés"
                    value={stats.active}
                />
                <StatCard
                    icon={<Archive size={22} />}
                    label="Dossiers archivés"
                    value={stats.archived}
                />
            </div>

            <section style={styles.panel}>
                <div style={styles.panelHeader}>
                    <div>
                        <h2 style={styles.panelTitle}>Liste des dossiers</h2>
                        <p style={styles.panelSubtitle}>
                            {filteredDossiers.length} résultat(s)
                        </p>
                    </div>
                </div>

                <div style={styles.filters}>
                    <div style={styles.searchContainer}>
                        <Search size={18} color={COLORS.muted} />
                        <input
                            type="text"
                            placeholder="Rechercher un dossier, un créateur..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        style={styles.select}
                    >
                        <option value="TOUS">Tous les départements</option>
                        {departments.map((department) => (
                            <option key={department} value={department}>
                                {department}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={styles.select}
                    >
                        <option value="TOUS">Tous les statuts</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {getStatusLabel(status)}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <AlertCircle size={19} />
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={loadDossiers}
                            style={styles.retryButton}
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {loading ? (
                    <div style={styles.message}>
                        <RefreshCw size={22} />
                        <span>Chargement des dossiers...</span>
                    </div>
                ) : !error && filteredDossiers.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FolderOpen size={38} color="#94a3b8" />
                        <h3>Aucun dossier trouvé</h3>
                        <p>
                            Modifiez les critères de recherche ou les filtres.
                        </p>
                    </div>
                ) : !error ? (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Référence</th>
                                <th style={styles.th}>Nom du dossier</th>
                                <th style={styles.th}>Département actuel</th>
                                <th style={styles.th}>Créé par</th>
                                <th style={styles.th}>Date de création</th>
                                <th style={styles.th}>Statut</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filteredDossiers.map((dossier) => (
                                <tr key={dossier.dossierId}>
                                    <td style={styles.td}>
                                            <span style={styles.reference}>
                                                #{dossier.dossierId}
                                            </span>
                                    </td>

                                    <td style={styles.td}>
                                        <strong style={styles.dossierName}>
                                            {dossier.nomDossier || 'Sans nom'}
                                        </strong>
                                        <span style={styles.description}>
                                                {dossier.description || 'Aucune description'}
                                            </span>
                                    </td>

                                    <td style={styles.td}>
                                        {dossier.departementActuel || 'Non renseigné'}
                                    </td>

                                    <td style={styles.td}>
                                        {dossier.creePar || 'Non renseigné'}
                                    </td>

                                    <td style={styles.td}>
                                        {formatDate(dossier.dateCreation)}
                                    </td>

                                    <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.status,
                                                    ...getStatusStyle(dossier.statut)
                                                }}
                                            >
                                                {getStatusLabel(dossier.statut)}
                                            </span>
                                    </td>

                                    <td style={styles.td}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDossier(dossier)}
                                            style={styles.viewButton}
                                            title="Consulter les détails"
                                        >
                                            <Eye size={17} />
                                            Voir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>

            {selectedDossier && (
                <div
                    style={styles.overlay}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedDossier(null);
                        }
                    }}
                >
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <div>
                                <span style={styles.modalEyebrow}>
                                    DOSSIER #{selectedDossier.dossierId}
                                </span>
                                <h2 style={styles.modalTitle}>
                                    {selectedDossier.nomDossier || 'Dossier sans nom'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedDossier(null)}
                                style={styles.closeButton}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <DetailItem
                                icon={<FileText size={18} />}
                                label="Description"
                                value={selectedDossier.description}
                            />
                            <DetailItem
                                icon={<Building2 size={18} />}
                                label="Département d'origine"
                                value={selectedDossier.departementOrigine}
                            />
                            <DetailItem
                                icon={<Building2 size={18} />}
                                label="Département actuel"
                                value={selectedDossier.departementActuel}
                            />
                            <DetailItem
                                icon={<UserRound size={18} />}
                                label="Créé par"
                                value={selectedDossier.creePar}
                            />
                            <DetailItem
                                icon={<CalendarDays size={18} />}
                                label="Date de création"
                                value={formatDate(selectedDossier.dateCreation)}
                            />
                            <DetailItem
                                icon={<FolderOpen size={18} />}
                                label="Statut"
                                value={getStatusLabel(selectedDossier.statut)}
                            />
                            <DetailItem
                                icon={<Archive size={18} />}
                                label="Archivé"
                                value={selectedDossier.archive}
                            />
                        </div>

                        <div style={styles.readOnlyNotice}>
                            <Eye size={17} />
                            Consultation en lecture seule : aucune modification du dossier
                            n'est autorisée depuis cet espace.
                        </div>

                        <div style={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setSelectedDossier(null)}
                                style={styles.closeModalButton}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div style={styles.statCard}>
        <div style={styles.statIcon}>{icon}</div>
        <div>
            <p style={styles.statLabel}>{label}</p>
            <strong style={styles.statValue}>{value}</strong>
        </div>
    </div>
);

const DetailItem = ({ icon, label, value }) => (
    <div style={styles.detailItem}>
        <div style={styles.detailIcon}>{icon}</div>
        <div>
            <span style={styles.detailLabel}>{label}</span>
            <p style={styles.detailValue}>{value || 'Non renseigné'}</p>
        </div>
    </div>
);

const styles = {
    page: {
        padding: '28px',
        minHeight: '100%',
        background: COLORS.background,
        color: COLORS.text
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '26px',
        flexWrap: 'wrap'
    },
    breadcrumb: {
        color: COLORS.muted,
        fontSize: '13px',
        marginBottom: '9px'
    },
    title: {
        margin: 0,
        fontSize: '27px',
        fontWeight: 750,
        letterSpacing: '-0.6px'
    },
    subtitle: {
        margin: '8px 0 0',
        color: COLORS.muted,
        fontSize: '14px'
    },
    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '11px 16px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '9px',
        background: '#fff',
        color: COLORS.text,
        fontWeight: 600,
        cursor: 'pointer'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '23px'
    },
    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '20px',
        background: '#fff',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px'
    },
    statIcon: {
        width: '46px',
        height: '46px',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '11px',
        background: COLORS.primaryLight,
        color: COLORS.primary
    },
    statLabel: {
        margin: '0 0 5px',
        fontSize: '13px',
        color: COLORS.muted
    },
    statValue: {
        fontSize: '23px',
        fontWeight: 750
    },
    panel: {
        background: '#fff',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '13px',
        overflow: 'hidden'
    },
    panelHeader: {
        padding: '21px 22px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    panelTitle: {
        margin: 0,
        fontSize: '17px',
        fontWeight: 700
    },
    panelSubtitle: {
        margin: '5px 0 0',
        fontSize: '13px',
        color: COLORS.muted
    },
    filters: {
        display: 'flex',
        gap: '11px',
        padding: '10px 22px 20px',
        flexWrap: 'wrap'
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        flex: '1 1 250px',
        minWidth: '220px',
        padding: '0 12px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        background: '#fff'
    },
    searchInput: {
        width: '100%',
        height: '40px',
        border: 'none',
        outline: 'none',
        fontSize: '13px',
        background: 'transparent'
    },
    select: {
        minWidth: '175px',
        height: '42px',
        padding: '0 11px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        background: '#fff',
        color: COLORS.text,
        fontSize: '13px',
        outline: 'none'
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '13px'
    },
    th: {
        padding: '14px 15px',
        background: '#f8fafc',
        color: COLORS.muted,
        fontWeight: 650,
        whiteSpace: 'nowrap',
        borderTop: `1px solid ${COLORS.border}`,
        borderBottom: `1px solid ${COLORS.border}`
    },
    td: {
        padding: '15px',
        borderBottom: `1px solid ${COLORS.border}`,
        verticalAlign: 'middle'
    },
    reference: {
        fontWeight: 700,
        color: COLORS.primary
    },
    dossierName: {
        display: 'block',
        fontSize: '13px',
        marginBottom: '4px'
    },
    description: {
        display: 'block',
        maxWidth: '190px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: COLORS.muted,
        fontSize: '12px'
    },
    status: {
        display: 'inline-block',
        padding: '6px 9px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap'
    },
    viewButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 11px',
        border: '1px solid #fecaca',
        borderRadius: '7px',
        color: COLORS.primary,
        background: '#fff',
        fontWeight: 650,
        cursor: 'pointer'
    },
    message: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        padding: '55px 20px',
        color: COLORS.muted
    },
    emptyState: {
        padding: '55px 20px',
        textAlign: 'center',
        color: COLORS.muted
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '0 22px 20px',
        padding: '13px',
        background: '#fef2f2',
        color: '#991b1b',
        borderRadius: '8px',
        fontSize: '13px'
    },
    retryButton: {
        marginLeft: 'auto',
        border: 'none',
        background: 'transparent',
        color: '#991b1b',
        fontWeight: 700,
        cursor: 'pointer'
    },
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        background: 'rgba(15, 23, 42, 0.48)'
    },
    modal: {
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#fff',
        borderRadius: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '23px',
        borderBottom: `1px solid ${COLORS.border}`
    },
    modalEyebrow: {
        color: COLORS.primary,
        fontSize: '11px',
        fontWeight: 750,
        letterSpacing: '1px'
    },
    modalTitle: {
        margin: '7px 0 0',
        fontSize: '21px'
    },
    closeButton: {
        display: 'grid',
        placeItems: 'center',
        width: '36px',
        height: '36px',
        border: 'none',
        borderRadius: '8px',
        background: '#f1f5f9',
        cursor: 'pointer'
    },
    modalBody: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        padding: '24px'
    },
    detailItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '11px'
    },
    detailIcon: {
        color: COLORS.primary,
        marginTop: '2px'
    },
    detailLabel: {
        color: COLORS.muted,
        fontSize: '12px'
    },
    detailValue: {
        margin: '5px 0 0',
        fontSize: '14px',
        fontWeight: 650,
        overflowWrap: 'anywhere'
    },
    readOnlyNotice: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '9px',
        margin: '0 23px',
        padding: '13px',
        background: '#f8fafc',
        color: COLORS.muted,
        borderRadius: '8px',
        fontSize: '12px',
        lineHeight: 1.5
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '20px 23px'
    },
    closeModalButton: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        background: COLORS.primary,
        color: '#fff',
        fontWeight: 650,
        cursor: 'pointer'
    }
};

export default AdminDossiersPage;
