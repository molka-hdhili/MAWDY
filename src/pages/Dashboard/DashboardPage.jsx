import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FolderKanban,
    Clock,
    CheckCircle2,
    XCircle,
    PlusCircle,
    CreditCard,
    Building2,
    FileText,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
    isReception,
    isFinance,
    isAdmin,
} from '../../utils/permissions';

import dossierService from '../../services/dossierService';
import Button from '../../components/common/Button';
import {
    Card,
    CardHeader,
    CardBody,
} from '../../components/common/Card';
import DossierStatusBadge from '../../components/dossiers/DossierStatusBadge';
import {
    formatCurrency,
    formatDate,
} from '../../utils/formatters';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            if (!user) {
                setDossiers([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const activeDossiers = await dossierService.getDossiers(user);
                const submittedDossiers = isReception(user)
                    ? await dossierService.getTransmittedByReception(user)
                    : [];
                const list = [...activeDossiers, ...submittedDossiers];

                if (active) {
                    setDossiers(list);
                }
            } catch (err) {
                console.error('Erreur chargement dashboard:', err);

                if (active) {
                    setDossiers([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            active = false;
        };
    }, [user]);

    const estReception = isReception(user);
    const estFinance = isFinance(user);
    const estAdmin = isAdmin(user);

    /* ============================================================
       1. DASHBOARD RECEPTION
    ============================================================ */

    if (estReception && !estAdmin) {
        // Dossiers toujours affectés à la Réception.
        const dossiersATraiter = dossiers.filter(
            (d) => d.typeRelation === 'AFFECTE'
        );

        // Dossiers transmis initialement par la Réception.
        const dossiersSoumis = dossiers.filter(
            (d) => d.typeRelation === 'TRANSMIS'
        );

        // Dossiers finalisés parmi les dossiers soumis.
        const dossiersFinalises = dossiersSoumis.filter((d) => {
            const status = Number(
                d.document?.statutId ?? d.statutId
            );

            return status === 27 || status === 28;
        });

        // Dossiers soumis qui ne sont pas encore finalisés.
        const dossiersEnAttente = dossiersSoumis.filter((d) => {
            const status = Number(
                d.document?.statutId ?? d.statutId
            );

            return status !== 27 && status !== 28;
        });

        // Toutes les lignes visibles dans le suivi de la Réception.
        const dossiersReception = [
            ...dossiersATraiter,
            ...dossiersSoumis,
        ].sort(
            (a, b) =>
                new Date(b.dateCreation || 0) -
                new Date(a.dateCreation || 0)
        );

        return (
            <div className="dashboard-grid">

                {/* Bannière Réception */}
                <div
                    className="card"
                    style={{
                        background:
                            'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)',
                        borderLeft: '4px solid var(--color-primary)',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: '1.35rem',
                                fontWeight: 800,
                                color: 'var(--color-text-main)',
                            }}
                        >
                            Espace Réception – {user?.name}
                        </h2>

                        
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        icon={PlusCircle}
                        onClick={() => navigate('/dossiers/nouveau')}
                    >
                        Créer un dossier
                    </Button>
                </div>

                {/* KPI Réception */}
                <div className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Dossiers soumis
              </span>

                            <span className="stat-value">
                {loading ? '...' : dossiersSoumis.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                            }}
                        >
                            <FolderKanban size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                En attente de traitement
              </span>

                            <span className="stat-value">
                {loading ? '...' : dossiersEnAttente.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                            }}
                        >
                            <Clock size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Dossiers finalisés
              </span>

                            <span className="stat-value">
                {loading ? '...' : dossiersFinalises.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                            }}
                        >
                            <CheckCircle2 size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Encore à la Réception
              </span>

                            <span className="stat-value">
                {loading ? '...' : dossiersATraiter.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                            }}
                        >
                            <Clock size={22} />
                        </div>
                    </div>

                </div>

                {/* Tableau Réception */}
                <Card>
                    <CardHeader
                        title="Mes dossiers récemment enregistrés"
                        action={
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/dossiers')}
                            >
                                Voir tous mes dossiers
                            </Button>
                        }
                    />

                    <CardBody style={{ padding: 0 }}>
                        {loading ? (
                            <p
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                }}
                            >
                                Chargement des dossiers...
                            </p>
                        ) : dossiersReception.length === 0 ? (
                            <p
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--color-text-muted)',
                                }}
                            >
                                Aucun dossier à afficher.
                            </p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Réf. Dossier</th>
                                    <th>Description</th>
                                    <th>Date de création</th>
                                    <th>Département actuel</th>
                                    <th>Relation</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {dossiersReception.slice(0, 6).map((d) => (
                                    <tr key={d.dossierId}>
                                        <td
                                            style={{
                                                fontWeight: 700,
                                                color: 'var(--color-primary)',
                                            }}
                                        >
                                            {d.nomDossier ||
                                                `Dossier #${d.dossierId}`}
                                        </td>

                                        <td>
                                            {d.description || '-'}
                                        </td>

                                        <td
                                            style={{
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            {formatDate(d.dateCreation)}
                                        </td>

                                        <td>
                                            {d.nomDepartementActuel || '-'}
                                        </td>

                                        <td>
                                            {d.typeRelation === 'TRANSMIS'
                                                ? 'Soumis'
                                                : 'À traiter'}
                                        </td>

                                        <td>
                                            <DossierStatusBadge
                                                statusId={
                                                    d.document?.statutId ??
                                                    d.statutId ??
                                                    d.statut
                                                }
                                            />
                                        </td>

                                        <td style={{ textAlign: 'right' }}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    navigate(`/dossiers/${d.dossierId}`)
                                                }
                                            >
                                                Consulter
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </CardBody>
                </Card>

            </div>
        );
    }

    /* ============================================================
       2. DASHBOARD DEPARTEMENT DE TRAITEMENT
    ============================================================ */

    if (!estFinance && !estAdmin) {
        const aValider = dossiers.filter((d) => {
            const status = Number(d.document?.statutId);

            return [1, 21, 22, 25].includes(status);
        }).length;

        const valides = dossiers.filter((d) => {
            const status = Number(d.document?.statutId);

            return status === 23;
        }).length;

        const rejetes = dossiers.filter((d) => {
            const status = Number(d.document?.statutId);

            return status === 24;
        }).length;

        return (
            <div className="dashboard-grid">

                <div
                    className="card"
                    style={{
                        background:
                            'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                        borderLeft: '4px solid #2563EB',
                        padding: '1.5rem',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.35rem',
                            fontWeight: 800,
                            color: 'var(--color-text-main)',
                        }}
                    >
                        Espace Département – {user?.department} ({user?.name})
                    </h2>

                    <p
                        style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.9rem',
                            marginTop: '0.25rem',
                        }}
                    >
                        Instruction des dossiers reçus : valider avec signature
                        ou rejeter avec une justification.
                    </p>
                </div>

                <div className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Dossiers à valider
              </span>

                            <span
                                className="stat-value"
                                style={{ color: 'var(--color-warning)' }}
                            >
                {aValider}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                            }}
                        >
                            <Clock size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Dossiers validés
              </span>

                            <span
                                className="stat-value"
                                style={{ color: 'var(--color-emerald)' }}
                            >
                {valides}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                            }}
                        >
                            <CheckCircle2 size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Dossiers rejetés
              </span>

                            <span
                                className="stat-value"
                                style={{ color: 'var(--color-danger)' }}
                            >
                {rejetes}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                            }}
                        >
                            <XCircle size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Assignés au département
              </span>

                            <span className="stat-value">
                {dossiers.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                            }}
                        >
                            <Building2 size={22} />
                        </div>
                    </div>

                </div>

                <Card>
                    <CardHeader
                        title={`Dossiers reçus à traiter (${dossiers.length})`}
                    />

                    <CardBody style={{ padding: 0 }}>
                        {dossiers.length === 0 ? (
                            <p
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--color-text-muted)',
                                }}
                            >
                                Aucun dossier en attente pour votre département.
                            </p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Réf. Dossier</th>
                                    <th>N° Facture</th>
                                    <th>Fournisseur</th>
                                    <th>Montant TTC</th>
                                    <th>Date Réception</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>
                                        Décision
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {dossiers.map((d) => (
                                    <tr key={d.dossierId}>
                                        <td
                                            style={{
                                                fontWeight: 700,
                                                color: 'var(--color-primary)',
                                            }}
                                        >
                                            {d.nomDossier}
                                        </td>

                                        <td style={{ fontFamily: 'monospace' }}>
                                            {d.document?.numeroFacture || '-'}
                                        </td>

                                        <td>
                                            {d.document?.fournisseur || '-'}
                                        </td>

                                        <td style={{ fontWeight: 700 }}>
                                            {formatCurrency(d.document?.montant)}
                                        </td>

                                        <td>
                                            {formatDate(
                                                d.document?.dateEntreeDepartement ||
                                                d.dateCreation
                                            )}
                                        </td>

                                        <td>
                                            <DossierStatusBadge
                                                statusId={d.document?.statutId ?? d.statut}
                                            />
                                        </td>

                                        <td style={{ textAlign: 'right' }}>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() =>
                                                    navigate(`/dossiers/${d.dossierId}`)
                                                }
                                            >
                                                Traiter le dossier
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </CardBody>
                </Card>

            </div>
        );
    }

    /* ============================================================
       3. DASHBOARD FINANCE
    ============================================================ */

    if (estFinance) {
        const enAttentePaiement = dossiers.filter(
            (d) =>
                Number(d.document?.statutId) === 26 ||
                Number(d.document?.statutId) === 23
        );

        const payes = dossiers.filter(
            (d) => Number(d.document?.statutId) === 27
        );

        const totalMontantAttente = enAttentePaiement.reduce(
            (acc, curr) =>
                acc + (Number(curr.document?.montant) || 0),
            0
        );

        const totalMontantPaye = payes.reduce(
            (acc, curr) =>
                acc + (Number(curr.document?.montant) || 0),
            0
        );

        return (
            <div className="dashboard-grid">

                <div
                    className="card"
                    style={{
                        background:
                            'linear-gradient(135deg, #FFFFFF 0%, #ECFEFF 100%)',
                        borderLeft: '4px solid #0891B2',
                        padding: '1.5rem',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.35rem',
                            fontWeight: 800,
                            color: 'var(--color-text-main)',
                        }}
                    >
                        Espace Direction Financière – {user?.name}
                    </h2>

                    
                </div>

                <div className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                En attente de règlement
              </span>

                            <span
                                className="stat-value"
                                style={{ color: '#0891B2' }}
                            >
                {enAttentePaiement.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#ECFEFF',
                                color: '#0891B2',
                            }}
                        >
                            <Clock size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Dossiers payés
              </span>

                            <span
                                className="stat-value"
                                style={{ color: '#16A34A' }}
                            >
                {payes.length}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#F0FDF4',
                                color: '#16A34A',
                            }}
                        >
                            <CreditCard size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Montant à régler
              </span>

                            <span
                                className="stat-value"
                                style={{
                                    fontSize: '1.25rem',
                                    color: '#0891B2',
                                }}
                            >
                {formatCurrency(totalMontantAttente)}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#ECFEFF',
                                color: '#0891B2',
                            }}
                        >
                            <FileText size={22} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
              <span className="stat-label">
                Montant payé
              </span>

                            <span
                                className="stat-value"
                                style={{
                                    fontSize: '1.25rem',
                                    color: '#16A34A',
                                }}
                            >
                {formatCurrency(totalMontantPaye)}
              </span>
                        </div>

                        <div
                            className="stat-icon-wrapper"
                            style={{
                                backgroundColor: '#F0FDF4',
                                color: '#16A34A',
                            }}
                        >
                            <CheckCircle2 size={22} />
                        </div>
                    </div>

                </div>

                <Card>
                    <CardHeader
                        title="Factures en attente d'ordonnancement et règlement"
                    />

                    <CardBody style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Réf. Dossier</th>
                                <th>N° Facture</th>
                                <th>Fournisseur</th>
                                <th>Montant TTC</th>
                                <th>Date Arrivée</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>
                                    Action
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {enAttentePaiement.map((d) => (
                                <tr key={d.dossierId}>
                                    <td
                                        style={{
                                            fontWeight: 700,
                                            color: 'var(--color-primary)',
                                        }}
                                    >
                                        {d.nomDossier}
                                    </td>

                                    <td style={{ fontFamily: 'monospace' }}>
                                        {d.document?.numeroFacture || '-'}
                                    </td>

                                    <td>
                                        {d.document?.fournisseur || '-'}
                                    </td>

                                    <td
                                        style={{
                                            fontWeight: 700,
                                            color: '#0891B2',
                                        }}
                                    >
                                        {formatCurrency(d.document?.montant)}
                                    </td>

                                    <td>
                                        {formatDate(
                                            d.document?.dateArrivee ||
                                            d.dateCreation
                                        )}
                                    </td>

                                    <td>
                                        <DossierStatusBadge
                                            statusId={d.document?.statutId ?? d.statut}
                                        />
                                    </td>

                                    <td style={{ textAlign: 'right' }}>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() =>
                                                navigate(`/dossiers/${d.dossierId}`)
                                            }
                                        >
                                            Consulter
                                        </Button>
                                    </td>
                                </tr>
                            ))}

                            {enAttentePaiement.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            textAlign: 'center',
                                            padding: '2rem',
                                        }}
                                    >
                                        Aucun dossier en attente.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>

            </div>
        );
    }

    /* ============================================================
       4. DASHBOARD ADMINISTRATION
    ============================================================ */

    return (
        <div className="dashboard-grid">

            <div
                className="card"
                style={{
                    background:
                        'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)',
                    borderLeft: '4px solid var(--color-primary)',
                    padding: '1.5rem',
                }}
            >
                <h2
                    style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: 'var(--color-text-main)',
                    }}
                >
                    Administration Globale MAWDY – {user?.name}
                </h2>

                <p
                    style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.9rem',
                        marginTop: '0.25rem',
                    }}
                >
                    Gestion des comptes, des rôles et des départements.
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
            <span className="stat-label">
              Accès administration
            </span>

                        <span className="stat-value">
              Actif
            </span>
                    </div>

                    <div
                        className="stat-icon-wrapper"
                        style={{
                            backgroundColor: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                        }}
                    >
                        <Building2 size={22} />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;
