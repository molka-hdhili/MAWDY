
import { ROLES, ROLE_IDS, DEPT_IDS } from './constants';

// =====================================================
// UTILITAIRES
// =====================================================

const sameId = (a, b) => {
  if (a === null || a === undefined ||
      b === null || b === undefined) {
    return false;
  }

  return String(a) === String(b);
};

const normalize = (value) =>
    String(value ?? '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

const getDepartmentId = (user) => {
  const value = user?.departementId ?? user?.departmentId;
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
};

const getRoleId = (user) => {
  const id = Number(user?.roleId);

  return Number.isInteger(id) && id > 0 ? id : null;
};

const getStatusId = (dossier) => {
  const value =
      dossier?.document?.statutId ??
      dossier?.statutId ??
      dossier?.document?.statusId ??
      dossier?.statusId;

  const status = Number(value);

  return Number.isFinite(status) ? status : 0;
};

// =====================================================
// IDENTIFICATION DES UTILISATEURS
// =====================================================

export const isAdmin = (user) => {
  if (!user) return false;

  return (
      normalize(user.role) === normalize(ROLES.ADMIN) ||
      normalize(user.roleName) === normalize(ROLES.ADMIN) ||
      sameId(getRoleId(user), 1)
  );
};

export const isReception = (user) => {
  if (!user || isAdmin(user)) return false;

  const departmentId = getDepartmentId(user);

  return (
      sameId(departmentId, DEPT_IDS.RECEPTION) ||
      normalize(user.departementName) === 'RECEPTION' ||
      normalize(user.departmentName) === 'RECEPTION' ||
      normalize(user.department) === 'RECEPTION'
  );
};

export const isFinance = (user) => {
  if (!user || isAdmin(user)) return false;

  const departmentId = getDepartmentId(user);

  return (
      normalize(user.role) === normalize(ROLES.FINANCE) ||
      normalize(user.roleName) === normalize(ROLES.FINANCE) ||
      sameId(getRoleId(user), 4) ||
      sameId(departmentId, DEPT_IDS.FINANCE)
  );
};

// =====================================================
// RESPONSABILITE DEPARTEMENTALE
// =====================================================

export const isDepartmentResponsible = (user, dossier) => {
  if (!user || !dossier) return false;

  if (isAdmin(user) || isReception(user)) {
    return false;
  }

  const userDepartmentId = getDepartmentId(user);
  const currentDepartmentId =
      dossier.departementActuelId ??
      dossier.departmentActuelId ??
      dossier.departementActuel?.departementId;

  if (userDepartmentId === null ||
      currentDepartmentId === null ||
      currentDepartmentId === undefined) {
    return false;
  }

  return sameId(userDepartmentId, currentDepartmentId);
};

// =====================================================
// CONSULTATION
// =====================================================

export const canViewWorkflowTracking = (user) => {
  if (!user || isReception(user)) {
    return false;
  }

  return true;
};

export const canViewAllDossiers = (user) => {
  return isAdmin(user);
};

// =====================================================
// CREATION DES DOSSIERS
// =====================================================

export const canCreateDossier = (user) => {
  return isReception(user);
};

// =====================================================
// SIGNATURE JPEG
// =====================================================

export const canUploadSignature = (user, dossier = null) => {
  if (!user || isAdmin(user) || isReception(user)) {
    return false;
  }

  const departmentId = getDepartmentId(user);

  if (departmentId === null) {
    return false;
  }

  // Lorsque les informations du dossier sont disponibles,
  // seul son département actuellement responsable peut signer.
  if (
      dossier &&
      dossier.departementActuelId !== undefined &&
      dossier.departementActuelId !== null
  ) {
    return isDepartmentResponsible(user, dossier);
  }

  // Pré-vérification frontend uniquement.
  // Le backend doit confirmer le département responsable,
  // le document concerné et l'utilisateur connecté.
  return true;
};

// =====================================================
// JUSTIFICATIFS PDF
// =====================================================

export const canUploadJustificatif = (user, dossier = null) => {
  if (!user || isAdmin(user) || isReception(user)) {
    return false;
  }

  if (getDepartmentId(user) === null) {
    return false;
  }

  // Roles accepted by the backend for business PDF uploads.
  if (!sameId(getDepartmentId(user), DEPT_IDS.SERVICES_GENERAUX)
      || ![ROLE_IDS.RESPONSABLE_SERVICE, ROLE_IDS.EMPLOYE].includes(getRoleId(user))) {
    return false;
  }

  if (dossier) {
    return isDepartmentResponsible(user, dossier);
  }

  return true;
};

// =====================================================
// PAIEMENT
// =====================================================

export const canProcessPayment = () => false;

// =====================================================
// DECISIONS METIER
// =====================================================

export const getAvailableDecisions = (user, dossier) => {
  if (!user || !dossier) {
    return [];
  }

  // ADMIN : supervision uniquement.
  if (isAdmin(user)) {
    return [];
  }

  // RECEPTION : aucune décision métier.
  if (isReception(user)) {
    return [];
  }

  // L'utilisateur doit appartenir au département actuel.
  if (!isDepartmentResponsible(user, dossier)) {
    return [];
  }

  const statutId = getStatusId(dossier);

  // =================================================
  // FINANCE
  // =================================================

  if (isFinance(user)) {
    // Finance traite uniquement les dossiers transmis.
    if (statutId !== 26) {
      return [];
    }

    return [
      {
        id: 'VALIDER',
        label: 'Valider la facture',
        variant: 'success',
        usesBackendSignature: true,
        description:
            'Valider la facture avec une signature JPEG.'
      },
      {
        id: 'REJETER',
        label: 'Rejeter',
        variant: 'danger',
        requiresJustification: true,
        description:
            'Le motif du rejet est obligatoire.'
      }
    ];
  }

  // =================================================
  // AUTRES DEPARTEMENTS
  // =================================================

  // Le backend accepte les dossiers en attente de validation
  // ou retournés pour correction.
  if (statutId !== 22 && statutId !== 25) {
    return [];
  }

  const decisions = [
    {
      id: 'VALIDER',
      label: 'Valider',
      variant: 'success',
      usesBackendSignature: true,
      description:
          'Valider le dossier avec une signature JPEG.'
    },
    {
      id: 'REJETER',
      label: 'Rejeter',
      variant: 'danger',
      requiresJustification: true,
      description:
          'Le motif du rejet est obligatoire.'
    }
  ];

  return decisions;
};

// =====================================================
// COMPATIBILITE ANCIENS COMPOSANTS
// =====================================================

export const getAvailableWorkflowActions = getAvailableDecisions;
