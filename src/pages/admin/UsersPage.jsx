import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Search,
    Plus,
    RefreshCw,
    Pencil,
    KeyRound,
    UserX,
    Users,
    X,
    Shield,
    Building2,
    Mail,
    AlertCircle,
    CheckCircle2,
    LoaderCircle
} from 'lucide-react';

import userService from '../../services/userService';
import apiClient from '../../services/api';
import { ROLE_IDS, ROLE_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    roleId: String(ROLE_IDS.EMPLOYE),
    departementId: ''
};

const getErrorMessage = (error) =>
    error?.userMessage ||
    error?.response?.data?.message ||
    error?.message ||
    'Une erreur est survenue.';

const getDepartmentId = (department) =>
    department?.departementId ?? department?.id;

const getDepartmentName = (department) =>
    department?.nom ?? department?.departementName ?? department?.name ?? '';

const getRoleLabel = (user) =>
    ROLE_LABELS[
        Object.keys(ROLE_IDS).find(
            (key) => ROLE_IDS[key] === Number(user.roleId)
        )
        ] || user.roleName || 'Non défini';

const UsersPage = () => {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const [modal, setModal] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [usersResponse, departmentsResponse] =
                await Promise.all([
                    userService.getAll(),
                    apiClient.get('/departements')
                ]);

            setUsers(
                Array.isArray(usersResponse) ? usersResponse : []
            );

            setDepartments(
                Array.isArray(departmentsResponse)
                    ? departmentsResponse.filter(
                        (department) =>
                            department.actif === undefined ||
                            Number(department.actif) === 1
                    )
                    : []
            );
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return users.filter((item) => {
            const fullName =
                `${item.prenom || ''} ${item.nom || ''}`.toLowerCase();

            const matchesSearch =
                !normalizedSearch ||
                fullName.includes(normalizedSearch) ||
                (item.email || '').toLowerCase().includes(normalizedSearch);

            const matchesRole =
                roleFilter === 'ALL' ||
                Number(item.roleId) === Number(roleFilter);

            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const closeModal = () => {
        if (saving) return;

        setModal(null);
        setSelectedUser(null);
        setForm(EMPTY_FORM);
    };

    const openCreate = () => {
        setSelectedUser(null);
        setForm({
            ...EMPTY_FORM,
            departementId: departments.length
                ? String(getDepartmentId(departments[0]))
                : ''
        });
        setModal('create');
    };

    const openEdit = (item) => {
        setSelectedUser(item);
        setForm({
            nom: item.nom || '',
            prenom: item.prenom || '',
            email: item.email || '',
            motDePasse: '',
            roleId: String(item.roleId ?? ''),
            departementId: String(item.departementId ?? '')
        });
        setModal('edit');
    };

    const openPassword = (item) => {
        setSelectedUser(item);
        setForm({ ...EMPTY_FORM, motDePasse: '' });
        setModal('password');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const showSuccess = (message) => {
        setNotice(message);
        window.setTimeout(() => setNotice(null), 3500);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (modal === 'create') {
                await userService.create(form);
                showSuccess('Utilisateur créé avec succès.');
            }

            if (modal === 'edit') {
                await userService.update(selectedUser.utilisateurId, form);
                showSuccess('Utilisateur modifié avec succès.');
            }

            if (modal === 'password') {
                await userService.changePassword(
                    selectedUser.utilisateurId,
                    form.motDePasse
                );
                showSuccess('Mot de passe modifié avec succès.');
            }

            closeModal();
            await loadData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (item) => {
        const confirmed = window.confirm(
            `Voulez-vous vraiment désactiver le compte de ${item.prenom} ${item.nom} ?`
        );

        if (!confirmed) return;

        setError('');

        try {
            await userService.deactivate(item.utilisateurId);

            // Le DTO ne retourne pas le champ actif.
            // On retire donc le compte de la liste affichée localement.
            setUsers((previous) =>
                previous.filter(
                    (userItem) =>
                        userItem.utilisateurId !== item.utilisateurId
                )
            );

            showSuccess('Compte désactivé avec succès.');
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const isCurrentUser = (item) =>
        Number(item.utilisateurId) === Number(
            currentUser?.utilisateurId ?? currentUser?.id
        );

    const inputStyle = {
        width: '100%',
        padding: '11px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: 9,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        background: '#fff',
        color: '#1e293b'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: 7,
        color: '#475569',
        fontSize: 13,
        fontWeight: 600
    };

    const buttonStyle = {
        border: 'none',
        borderRadius: 9,
        padding: '10px 14px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7
    };

    const openModalTitle = {
        create: 'Ajouter un utilisateur',
        edit: 'Modifier un utilisateur',
        password: 'Modifier le mot de passe'
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: 1440,
            margin: '0 auto',
            color: '#1e293b'
        }}>
            {/* EN-TÊTE */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 25
            }}>
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 7
                    }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: '#fff1f2',
                            color: '#dc2626',
                            display: 'grid',
                            placeItems: 'center'
                        }}>
                            <Users size={21} />
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: 25,
                                fontWeight: 750,
                                margin: 0
                            }}>
                                Gestion des utilisateurs
                            </h1>
                        </div>
                    </div>

                    <p style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: 14
                    }}>
                        Administration des comptes, rôles et mots de passe.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 9 }}>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            background: '#fff',
                            color: '#475569',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <RefreshCw size={15} />
                        Actualiser
                    </button>

                    <button
                        onClick={openCreate}
                        style={{
                            ...buttonStyle,
                            background: '#dc2626',
                            color: '#fff'
                        }}
                    >
                        <Plus size={16} />
                        Nouvel utilisateur
                    </button>
                </div>
            </div>

            {/* NOTIFICATION */}
            {notice && (
                <div style={{
                    padding: 13,
                    borderRadius: 10,
                    background: '#ecfdf5',
                    color: '#047857',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    fontSize: 14
                }}>
                    <CheckCircle2 size={18} />
                    {notice}
                </div>
            )}

            {error && (
                <div style={{
                    padding: 13,
                    borderRadius: 10,
                    background: '#fef2f2',
                    color: '#b91c1c',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    fontSize: 14
                }}>
                    <AlertCircle size={18} />
                    {error}
                    <button
                        onClick={() => setError('')}
                        style={{
                            marginLeft: 'auto',
                            border: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'inherit'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* STATISTIQUES */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 14,
                marginBottom: 22
            }}>
                <div style={{
                    background: '#fff',
                    border: '1px solid #e8edf3',
                    borderRadius: 13,
                    padding: 18
                }}>
                    <div style={{
                        color: '#64748b',
                        fontSize: 13,
                        marginBottom: 8
                    }}>
                        Utilisateurs enregistrés
                    </div>
                    <div style={{
                        fontSize: 27,
                        fontWeight: 750
                    }}>
                        {users.length}
                    </div>
                </div>

                <div style={{
                    background: '#fff',
                    border: '1px solid #e8edf3',
                    borderRadius: 13,
                    padding: 18
                }}>
                    <div style={{
                        color: '#64748b',
                        fontSize: 13,
                        marginBottom: 8
                    }}>
                        Responsables de service
                    </div>
                    <div style={{
                        fontSize: 27,
                        fontWeight: 750
                    }}>
                        {users.filter(
                            (item) =>
                                Number(item.roleId) === ROLE_IDS.RESPONSABLE_SERVICE
                        ).length}
                    </div>
                </div>

                <div style={{
                    background: '#fff',
                    border: '1px solid #e8edf3',
                    borderRadius: 13,
                    padding: 18
                }}>
                    <div style={{
                        color: '#64748b',
                        fontSize: 13,
                        marginBottom: 8
                    }}>
                        Départements représentés
                    </div>
                    <div style={{
                        fontSize: 27,
                        fontWeight: 750
                    }}>
                        {new Set(
                            users
                                .map((item) => item.departementId)
                                .filter((id) => id !== null && id !== undefined)
                        ).size}
                    </div>
                </div>
            </div>

            {/* TABLEAU */}
            <div style={{
                background: '#fff',
                border: '1px solid #e8edf3',
                borderRadius: 14,
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: 17,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    borderBottom: '1px solid #edf1f5'
                }}>
                    <div style={{
                        flex: 1,
                        minWidth: 220,
                        position: 'relative'
                    }}>
                        <Search
                            size={17}
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: 11,
                                color: '#94a3b8'
                            }}
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Rechercher par nom ou email..."
                            style={{
                                ...inputStyle,
                                paddingLeft: 38
                            }}
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                        style={{
                            ...inputStyle,
                            width: 'auto',
                            minWidth: 190
                        }}
                    >
                        <option value="ALL">Tous les rôles</option>
                        {Object.entries(ROLE_IDS).map(([key, id]) => (
                            <option key={id} value={id}>
                                {ROLE_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div style={{
                        padding: 55,
                        textAlign: 'center',
                        color: '#64748b'
                    }}>
                        <LoaderCircle
                            size={25}
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <p>Chargement des utilisateurs...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{
                        padding: 55,
                        textAlign: 'center',
                        color: '#64748b'
                    }}>
                        <Users size={30} />
                        <p>Aucun utilisateur trouvé.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 800
                        }}>
                            <thead>
                            <tr style={{
                                background: '#f8fafc',
                                color: '#64748b',
                                fontSize: 12,
                                textAlign: 'left'
                            }}>
                                {[
                                    'UTILISATEUR',
                                    'EMAIL',
                                    'RÔLE',
                                    'DÉPARTEMENT',
                                    'ACTIONS'
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        style={{
                                            padding: '14px 17px',
                                            fontWeight: 650,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {filteredUsers.map((item) => (
                                <tr
                                    key={item.utilisateurId}
                                    style={{
                                        borderTop: '1px solid #edf1f5'
                                    }}
                                >
                                    <td style={{ padding: '14px 17px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 11
                                        }}>
                                            <div style={{
                                                width: 37,
                                                height: 37,
                                                borderRadius: 11,
                                                background: '#fff1f2',
                                                color: '#dc2626',
                                                display: 'grid',
                                                placeItems: 'center',
                                                fontSize: 12,
                                                fontWeight: 750
                                            }}>
                                                {`${item.prenom?.[0] || ''}${item.nom?.[0] || ''}`.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{
                                                    fontSize: 14,
                                                    fontWeight: 650
                                                }}>
                                                    {item.prenom} {item.nom}
                                                </div>
                                                <div style={{
                                                    fontSize: 11,
                                                    color: '#94a3b8'
                                                }}>
                                                    ID #{item.utilisateurId}
                                                    {isCurrentUser(item) ? ' · Vous' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{
                                        padding: '14px 17px',
                                        fontSize: 13,
                                        color: '#475569'
                                    }}>
                                        {item.email}
                                    </td>

                                    <td style={{ padding: '14px 17px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                borderRadius: 20,
                                                padding: '6px 9px',
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                fontSize: 11,
                                                fontWeight: 650
                                            }}>
                                                <Shield size={13} />
                                                {getRoleLabel(item)}
                                            </span>
                                    </td>

                                    <td style={{
                                        padding: '14px 17px',
                                        fontSize: 13,
                                        color: '#475569'
                                    }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}>
                                                <Building2 size={14} color="#94a3b8" />
                                                {item.departementName || 'Non affecté'}
                                            </span>
                                    </td>

                                    <td style={{ padding: '14px 17px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}>
                                            <button
                                                title="Modifier"
                                                onClick={() => openEdit(item)}
                                                style={{
                                                    ...buttonStyle,
                                                    padding: 8,
                                                    background: '#eff6ff',
                                                    color: '#2563eb'
                                                }}
                                            >
                                                <Pencil size={15} />
                                            </button>

                                            <button
                                                title="Changer le mot de passe"
                                                onClick={() => openPassword(item)}
                                                style={{
                                                    ...buttonStyle,
                                                    padding: 8,
                                                    background: '#f5f3ff',
                                                    color: '#7c3aed'
                                                }}
                                            >
                                                <KeyRound size={15} />
                                            </button>

                                            <button
                                                title={
                                                    isCurrentUser(item)
                                                        ? 'Vous ne pouvez pas désactiver votre compte'
                                                        : 'Désactiver'
                                                }
                                                disabled={isCurrentUser(item)}
                                                onClick={() => handleDeactivate(item)}
                                                style={{
                                                    ...buttonStyle,
                                                    padding: 8,
                                                    background: isCurrentUser(item)
                                                        ? '#f1f5f9'
                                                        : '#fef2f2',
                                                    color: isCurrentUser(item)
                                                        ? '#94a3b8'
                                                        : '#dc2626',
                                                    cursor: isCurrentUser(item)
                                                        ? 'not-allowed'
                                                        : 'pointer'
                                                }}
                                            >
                                                <UserX size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{
                    padding: '13px 17px',
                    borderTop: '1px solid #edf1f5',
                    color: '#94a3b8',
                    fontSize: 12
                }}>
                    {filteredUsers.length} utilisateur(s) affiché(s)
                </div>
            </div>

            {/* MODALE */}
            {modal && (
                <div
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        background: 'rgba(15, 23, 42, 0.48)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 18
                    }}
                >
                    <div style={{
                        background: '#fff',
                        width: '100%',
                        maxWidth: 510,
                        borderRadius: 16,
                        padding: 24,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(15,23,42,.2)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 22
                        }}>
                            <h2 style={{
                                fontSize: 19,
                                margin: 0,
                                fontWeight: 750
                            }}>
                                {openModalTitle[modal]}
                            </h2>

                            <button
                                onClick={closeModal}
                                disabled={saving}
                                style={{
                                    border: 0,
                                    background: '#f1f5f9',
                                    borderRadius: 8,
                                    padding: 7,
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {modal === 'password' ? (
                                <>
                                    <p style={{
                                        fontSize: 13,
                                        color: '#64748b',
                                        marginTop: 0,
                                        marginBottom: 17
                                    }}>
                                        Nouveau mot de passe pour{' '}
                                        <strong>
                                            {selectedUser?.prenom} {selectedUser?.nom}
                                        </strong>.
                                    </p>

                                    <label style={labelStyle}>
                                        Nouveau mot de passe
                                    </label>

                                    <input
                                        type="password"
                                        name="motDePasse"
                                        value={form.motDePasse}
                                        onChange={handleChange}
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        required
                                        placeholder="Minimum 8 caractères"
                                        style={inputStyle}
                                    />
                                </>
                            ) : (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 13
                                    }}>
                                        <div>
                                            <label style={labelStyle}>Nom</label>
                                            <input
                                                name="nom"
                                                value={form.nom}
                                                onChange={handleChange}
                                                maxLength={100}
                                                required
                                                style={inputStyle}
                                            />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Prénom</label>
                                            <input
                                                name="prenom"
                                                value={form.prenom}
                                                onChange={handleChange}
                                                maxLength={100}
                                                required
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 15 }}>
                                        <label style={labelStyle}>Adresse email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            maxLength={255}
                                            required
                                            style={inputStyle}
                                        />
                                    </div>

                                    {modal === 'create' && (
                                        <div style={{ marginTop: 15 }}>
                                            <label style={labelStyle}>
                                                Mot de passe initial
                                            </label>
                                            <input
                                                type="password"
                                                name="motDePasse"
                                                value={form.motDePasse}
                                                onChange={handleChange}
                                                minLength={8}
                                                maxLength={100}
                                                autoComplete="new-password"
                                                required
                                                style={inputStyle}
                                                placeholder="Minimum 8 caractères"
                                            />
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 13,
                                        marginTop: 15
                                    }}>
                                        <div>
                                            <label style={labelStyle}>Rôle</label>
                                            <select
                                                name="roleId"
                                                value={form.roleId}
                                                onChange={handleChange}
                                                required
                                                style={inputStyle}
                                            >
                                                {Object.entries(ROLE_IDS).map(([key, id]) => (
                                                    <option key={id} value={id}>
                                                        {ROLE_LABELS[key]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Département</label>
                                            <select
                                                name="departementId"
                                                value={form.departementId}
                                                onChange={handleChange}
                                                required
                                                style={inputStyle}
                                            >
                                                <option value="">
                                                    Sélectionner
                                                </option>

                                                {departments.map((department) => (
                                                    <option
                                                        key={getDepartmentId(department)}
                                                        value={getDepartmentId(department)}
                                                    >
                                                        {getDepartmentName(department)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 9,
                                marginTop: 25
                            }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    style={{
                                        ...buttonStyle,
                                        background: '#f1f5f9',
                                        color: '#475569'
                                    }}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        ...buttonStyle,
                                        background: '#dc2626',
                                        color: '#fff',
                                        opacity: saving ? 0.7 : 1
                                    }}
                                >
                                    {saving ? (
                                        <LoaderCircle size={15} />
                                    ) : (
                                        <CheckCircle2 size={15} />
                                    )}

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
};

export default UsersPage;
