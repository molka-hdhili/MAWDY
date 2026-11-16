
import { useEffect, useMemo, useState } from 'react';

import {
    Building2,
    Plus,
    Search,
    Pencil,
    Power,
    X,
    Check,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Users,
    CircleOff
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

const INITIAL_FORM = {
    nom: '',
    description: '',
    actif: 1
};

const getErrorMessage = (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) {
        return 'Votre session a expiré. Veuillez vous reconnecter.';
    }

    if (status === 403) {
        return "Accès refusé. Seul l'administrateur peut effectuer cette opération.";
    }

    if (status === 409) {
        return 'Un département avec ce nom existe déjà.';
    }

    return (
        data?.message ||
        data?.detail ||
        data?.error ||
        error?.message ||
        'Une erreur est survenue. Veuillez réessayer.'
    );
};

const normalizeDepartements = (response) => {
    const data = response?.data ?? response;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.content)) {
        return data.content;
    }

    return [];
};

export default function DepartementsPage() {
    const { isAdmin, loading: authLoading } = useAuth();

    const [departements, setDepartements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('TOUS');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);

    const [pageError, setPageError] = useState('');
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState('');

    // ============================================
    // CHARGEMENT DES DEPARTEMENTS
    // ============================================

    const loadDepartements = async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError('');

        try {
            const response = await apiClient.get('/departements');

            setDepartements(normalizeDepartements(response));
        } catch (error) {
            setPageError(getErrorMessage(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;

        if (!isAdmin) {
            setLoading(false);
            return;
        }

        loadDepartements();
    }, [authLoading, isAdmin]);

    // ============================================
    // STATISTIQUES
    // ============================================

    const total = departements.length;

    const actifs = departements.filter(
        (d) => Number(d.actif) === 1
    ).length;

    const inactifs = total - actifs;

    // ============================================
    // RECHERCHE ET FILTRAGE
    // ============================================

    const filteredDepartements = useMemo(() => {
        return departements.filter((d) => {
            const nom = (d.nom || '').toLowerCase();
            const description = (d.description || '').toLowerCase();
            const searchValue = search.trim().toLowerCase();

            const matchesSearch =
                nom.includes(searchValue) ||
                description.includes(searchValue);

            const matchesStatus =
                statusFilter === 'TOUS' ||
                (statusFilter === 'ACTIFS' && Number(d.actif) === 1) ||
                (statusFilter === 'INACTIFS' && Number(d.actif) === 0);

            return matchesSearch && matchesStatus;
        });
    }, [departements, search, statusFilter]);

    // ============================================
    // GESTION DU FORMULAIRE
    // ============================================

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setEditingId(null);
        setFormError('');
    };

    const openAddModal = () => {
        resetForm();
        setPageError('');
        setSuccess('');
        setModalOpen(true);
    };

    const openEditModal = (departement) => {
        setForm({
            nom: departement.nom || '',
            description: departement.description || '',
            actif: Number(departement.actif ?? 1)
        });

        setEditingId(departement.departementId);
        setFormError('');
        setPageError('');
        setSuccess('');
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        resetForm();
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: name === 'actif' ? Number(value) : value
        }));
    };

    // ============================================
    // AJOUT / MODIFICATION
    // ============================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nom = form.nom.trim();
        const description = form.description.trim();

        if (!nom) {
            setFormError('Le nom du département est obligatoire.');
            return;
        }

        // Vérification locale rapide des doublons.
        const duplicate = departements.some((d) => {
            const sameName =
                (d.nom || '').trim().toLowerCase() === nom.toLowerCase();

            const sameId =
                String(d.departementId) === String(editingId);

            return sameName && !sameId;
        });

        if (duplicate) {
            setFormError('Un département avec ce nom existe déjà.');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            const payload = {
                nom,
                description,
                actif: Number(form.actif)
            };

            if (editingId !== null) {
                await apiClient.put(
                    `/departements/${editingId}`,
                    payload
                );

                setSuccess('Département modifié avec succès.');
            } else {
                await apiClient.post('/departements', payload);

                setSuccess('Département ajouté avec succès.');
            }

            setModalOpen(false);
            resetForm();

            await loadDepartements();
        } catch (error) {
            setFormError(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // ACTIVATION / DESACTIVATION
    // ============================================

    const toggleActivation = async (departement) => {
        const currentStatus = Number(departement.actif);
        const newStatus = currentStatus === 1 ? 0 : 1;

        const action = newStatus === 1 ? 'activer' : 'désactiver';

        const confirmation = window.confirm(
            `Voulez-vous vraiment ${action} le département "${departement.nom}" ?`
        );

        if (!confirmation) return;

        setPageError('');
        setSuccess('');

        try {
            await apiClient.patch(
                `/departements/${departement.departementId}/activation`,
                {
                    actif: newStatus
                }
            );

            setSuccess(
                newStatus === 1
                    ? 'Département activé avec succès.'
                    : 'Département désactivé avec succès.'
            );

            await loadDepartements();
        } catch (error) {
            setPageError(getErrorMessage(error));
        }
    };

    // ============================================
    // CHARGEMENT AUTHENTIFICATION
    // ============================================

    if (authLoading) {
        return (
            <div className="dept-loading">
                Vérification de votre session...
            </div>
        );
    }

    // ============================================
    // PROTECTION ADMIN
    // ============================================

    if (!isAdmin) {
        return (
            <div className="dept-unauthorized">
                <AlertCircle size={35} />
                <h2>Accès non autorisé</h2>
                <p>
                    La gestion des départements est réservée
                    à l'administrateur.
                </p>
            </div>
        );
    }

    // ============================================
    // INTERFACE
    // ============================================

    return (
        <div className="departements-page">

            <style>{`
                .departements-page {
                    padding: 30px;
                    color: #252525;
                    font-family: inherit;
                    width: 100%;
                    box-sizing: border-box;
                }

                .dept-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 27px;
                }

                .dept-heading h1 {
                    margin: 0 0 7px;
                    font-size: 25px;
                    font-weight: 700;
                    color: #242424;
                }

                .dept-heading p {
                    margin: 0;
                    font-size: 13px;
                    color: #858585;
                }

                .dept-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    padding: 11px 17px;
                    background: #b82035;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: .2s;
                }

                .dept-primary:hover {
                    background: #98182c;
                }

                .dept-primary:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                }

                .dept-stats {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 17px;
                    margin-bottom: 25px;
                }

                .dept-stat {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: #fff;
                    border: 1px solid #ededed;
                    border-radius: 11px;
                    padding: 19px;
                }

                .dept-stat-icon {
                    width: 43px;
                    height: 43px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: #fff0f1;
                    color: #b82035;
                }

                .dept-stat-icon.green {
                    background: #edf8f0;
                    color: #24834a;
                }

                .dept-stat-icon.gray {
                    background: #f2f2f2;
                    color: #777;
                }

                .dept-stat-label {
                    font-size: 12px;
                    color: #858585;
                    margin-bottom: 6px;
                }

                .dept-stat-value {
                    font-size: 23px;
                    font-weight: 700;
                    color: #282828;
                }

                .dept-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    margin-bottom: 17px;
                }

                .dept-toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .dept-search {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    width: 290px;
                    padding: 0 12px;
                    background: white;
                    border: 1px solid #e7e7e7;
                    border-radius: 8px;
                }

                .dept-search input {
                    width: 100%;
                    padding: 11px 0;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 13px;
                }

                .dept-filter {
                    padding: 10px 12px;
                    border: 1px solid #e7e7e7;
                    border-radius: 8px;
                    background: white;
                    color: #555;
                    font-size: 12px;
                    outline: none;
                    cursor: pointer;
                }

                .dept-refresh {
                    width: 38px;
                    height: 38px;
                    display: grid;
                    place-items: center;
                    border: 1px solid #e7e7e7;
                    border-radius: 8px;
                    background: white;
                    color: #555;
                    cursor: pointer;
                }

                .dept-refresh:hover {
                    background: #f8f8f8;
                }

                .dept-table-container {
                    overflow-x: auto;
                    background: white;
                    border: 1px solid #ededed;
                    border-radius: 11px;
                }

                .dept-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }

                .dept-table th {
                    padding: 15px 18px;
                    background: #fafafa;
                    border-bottom: 1px solid #eee;
                    color: #777;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: .3px;
                    white-space: nowrap;
                }

                .dept-table td {
                    padding: 15px 18px;
                    border-bottom: 1px solid #f0f0f0;
                    color: #555;
                    font-size: 13px;
                }

                .dept-table tbody tr:hover {
                    background: #fdfdfd;
                }

                .dept-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .dept-name {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    color: #292929;
                    font-weight: 600;
                }

                .dept-icon {
                    width: 36px;
                    height: 36px;
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                    background: #fff0f1;
                    color: #b82035;
                    border-radius: 9px;
                }

                .dept-description {
                    color: #888;
                    max-width: 300px;
                }

                .dept-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border-radius: 20px;
                    padding: 5px 10px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .dept-status.active {
                    background: #eaf7ef;
                    color: #23824a;
                }

                .dept-status.inactive {
                    background: #f1f1f1;
                    color: #777;
                }

                .dept-actions {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }

                .dept-action {
                    width: 33px;
                    height: 33px;
                    display: grid;
                    place-items: center;
                    border: 1px solid #e8e8e8;
                    border-radius: 7px;
                    background: white;
                    color: #555;
                    cursor: pointer;
                }

                .dept-action:hover {
                    background: #f7f7f7;
                }

                .dept-action.danger {
                    color: #b82035;
                }

                .dept-action.success {
                    color: #23824a;
                }

                .dept-alert {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 12px 15px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 13px;
                }

                .dept-alert.error {
                    background: #fff0f0;
                    color: #b42332;
                }

                .dept-alert.success {
                    background: #edf8f0;
                    color: #267443;
                }

                .dept-empty {
                    text-align: center;
                    padding: 45px 15px !important;
                    color: #888 !important;
                }

                .dept-loading,
                .dept-unauthorized {
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: #777;
                    text-align: center;
                }

                .dept-unauthorized h2 {
                    color: #292929;
                    margin: 0;
                }

                .dept-unauthorized p {
                    font-size: 13px;
                }

                .dept-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(20, 20, 20, .45);
                }

                .dept-modal {
                    width: 100%;
                    max-width: 470px;
                    padding: 25px;
                    background: white;
                    border-radius: 13px;
                    box-shadow: 0 15px 50px rgba(0,0,0,.15);
                }

                .dept-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 22px;
                }

                .dept-modal-header h2 {
                    margin: 0;
                    font-size: 19px;
                    color: #292929;
                }

                .dept-close {
                    display: grid;
                    place-items: center;
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 7px;
                    background: transparent;
                    color: #777;
                    cursor: pointer;
                }

                .dept-close:hover {
                    background: #f5f5f5;
                }

                .dept-field {
                    margin-bottom: 17px;
                }

                .dept-field label {
                    display: block;
                    margin-bottom: 8px;
                    color: #444;
                    font-size: 12px;
                    font-weight: 600;
                }

                .dept-field input,
                .dept-field textarea,
                .dept-field select {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 11px 12px;
                    border: 1px solid #dedede;
                    border-radius: 8px;
                    outline: none;
                    background: white;
                    color: #333;
                    font-family: inherit;
                    font-size: 13px;
                }

                .dept-field input:focus,
                .dept-field textarea:focus,
                .dept-field select:focus {
                    border-color: #b82035;
                }

                .dept-field textarea {
                    min-height: 85px;
                    resize: vertical;
                }

                .dept-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 23px;
                }

                .dept-secondary {
                    padding: 10px 16px;
                    border: 1px solid #dedede;
                    border-radius: 8px;
                    background: white;
                    color: #555;
                    font-size: 13px;
                    cursor: pointer;
                }

                .dept-secondary:hover {
                    background: #f7f7f7;
                }

                .dept-form-error {
                    margin-bottom: 15px;
                    padding: 10px 12px;
                    border-radius: 7px;
                    background: #fff0f0;
                    color: #b42332;
                    font-size: 12px;
                }

                @media (max-width: 760px) {
                    .departements-page {
                        padding: 18px;
                    }

                    .dept-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .dept-stats {
                        grid-template-columns: 1fr;
                    }

                    .dept-toolbar {
                        align-items: stretch;
                        flex-direction: column;
                    }

                    .dept-toolbar-left {
                        width: 100%;
                    }

                    .dept-search {
                        flex: 1;
                        width: auto;
                    }
                }
            `}</style>

            {/* EN-TETE */}
            <div className="dept-header">
                <div className="dept-heading">
                    <h1>Gestion des départements</h1>
                    <p>
                        Consultez et gérez les départements de MAWDY.
                    </p>
                </div>

                <button
                    className="dept-primary"
                    onClick={openAddModal}
                >
                    <Plus size={17} />
                    Ajouter un département
                </button>
            </div>

            {/* MESSAGES */}
            {pageError && (
                <div className="dept-alert error">
                    <AlertCircle size={17} />
                    {pageError}
                </div>
            )}

            {success && (
                <div className="dept-alert success">
                    <CheckCircle2 size={17} />
                    {success}
                </div>
            )}

            {/* STATISTIQUES */}
            <div className="dept-stats">
                <div className="dept-stat">
                    <div className="dept-stat-icon">
                        <Building2 size={21} />
                    </div>

                    <div>
                        <div className="dept-stat-label">
                            Total départements
                        </div>
                        <div className="dept-stat-value">{total}</div>
                    </div>
                </div>

                <div className="dept-stat">
                    <div className="dept-stat-icon green">
                        <Users size={21} />
                    </div>

                    <div>
                        <div className="dept-stat-label">
                            Départements actifs
                        </div>
                        <div className="dept-stat-value">{actifs}</div>
                    </div>
                </div>

                <div className="dept-stat">
                    <div className="dept-stat-icon gray">
                        <CircleOff size={21} />
                    </div>

                    <div>
                        <div className="dept-stat-label">
                            Départements désactivés
                        </div>
                        <div className="dept-stat-value">{inactifs}</div>
                    </div>
                </div>
            </div>

            {/* RECHERCHE ET FILTRES */}
            <div className="dept-toolbar">
                <div className="dept-toolbar-left">
                    <div className="dept-search">
                        <Search size={17} color="#999" />

                        <input
                            type="text"
                            placeholder="Rechercher un département..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="dept-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="TOUS">Tous les statuts</option>
                        <option value="ACTIFS">Actifs</option>
                        <option value="INACTIFS">Désactivés</option>
                    </select>
                </div>

                <button
                    className="dept-refresh"
                    onClick={() => loadDepartements(true)}
                    disabled={refreshing}
                    title="Actualiser"
                >
                    <RefreshCw
                        size={16}
                        className={refreshing ? 'animate-spin' : ''}
                    />
                </button>
            </div>

            {/* TABLEAU */}
            <div className="dept-table-container">
                <table className="dept-table">
                    <thead>
                    <tr>
                        <th>Département</th>
                        <th>Description</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="dept-empty">
                                Chargement des départements...
                            </td>
                        </tr>
                    ) : filteredDepartements.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="dept-empty">
                                Aucun département trouvé.
                            </td>
                        </tr>
                    ) : (
                        filteredDepartements.map((d) => {
                            const actif = Number(d.actif) === 1;

                            return (
                                <tr key={d.departementId}>
                                    <td>
                                        <div className="dept-name">
                                            <div className="dept-icon">
                                                <Building2 size={17} />
                                            </div>
                                            {d.nom}
                                        </div>
                                    </td>

                                    <td>
                                            <span className="dept-description">
                                                {d.description || 'Aucune description'}
                                            </span>
                                    </td>

                                    <td>
                                            <span
                                                className={`dept-status ${
                                                    actif ? 'active' : 'inactive'
                                                }`}
                                            >
                                                {actif ? 'Actif' : 'Désactivé'}
                                            </span>
                                    </td>

                                    <td>
                                        <div className="dept-actions">
                                            <button
                                                className="dept-action"
                                                title="Modifier"
                                                onClick={() => openEditModal(d)}
                                            >
                                                <Pencil size={15} />
                                            </button>

                                            <button
                                                className={`dept-action ${
                                                    actif ? 'danger' : 'success'
                                                }`}
                                                title={
                                                    actif
                                                        ? 'Désactiver'
                                                        : 'Activer'
                                                }
                                                onClick={() => toggleActivation(d)}
                                            >
                                                <Power size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* MODAL AJOUT / MODIFICATION */}
            {modalOpen && (
                <div
                    className="dept-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="dept-modal">
                        <div className="dept-modal-header">
                            <h2>
                                {editingId !== null
                                    ? 'Modifier le département'
                                    : 'Ajouter un département'}
                            </h2>

                            <button
                                type="button"
                                className="dept-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {formError && (
                            <div className="dept-form-error">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="dept-field">
                                <label htmlFor="dept-nom">
                                    Nom du département *
                                </label>

                                <input
                                    id="dept-nom"
                                    name="nom"
                                    type="text"
                                    value={form.nom}
                                    onChange={handleChange}
                                    placeholder="Ex. Marketing"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="dept-field">
                                <label htmlFor="dept-description">
                                    Description
                                </label>

                                <textarea
                                    id="dept-description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Description du département..."
                                />
                            </div>

                            {editingId !== null && (
                                <div className="dept-field">
                                    <label htmlFor="dept-actif">
                                        Statut
                                    </label>

                                    <select
                                        id="dept-actif"
                                        name="actif"
                                        value={form.actif}
                                        onChange={handleChange}
                                    >
                                        <option value={1}>Actif</option>
                                        <option value={0}>Désactivé</option>
                                    </select>
                                </div>
                            )}

                            <div className="dept-modal-footer">
                                <button
                                    type="button"
                                    className="dept-secondary"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="dept-primary"
                                    disabled={saving}
                                >
                                    <Check size={16} />

                                    {saving
                                        ? 'Enregistrement...'
                                        : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
