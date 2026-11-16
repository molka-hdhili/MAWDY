
/**
 * MAWDY - Constantes métier
 * Référentiels Oracle Database
 */

// =====================================================
// ROLES
// =====================================================

export const ROLES = {
  ADMIN: 'ADMIN',
  RESPONSABLE_SERVICE: 'RESPONSABLE_SERVICE',
  EMPLOYE: 'EMPLOYE',
  FINANCE: 'FINANCE'
};

export const ROLE_IDS = {
  ADMIN: 1,
  RESPONSABLE_SERVICE: 2,
  EMPLOYE: 3,
  FINANCE: 4
};

export const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  RESPONSABLE_SERVICE: 'Responsable de Service',
  EMPLOYE: 'Employé',
  FINANCE: 'Gestionnaire Finance'
};

// =====================================================
// DEPARTEMENTS ORACLE
// =====================================================

export const DEPARTEMENTS = [
  { id: 1, nom: 'Juridique', actif: 1 },
  { id: 2, nom: 'Services generaux', actif: 1 },
  { id: 3, nom: 'Operations', actif: 1 },
  { id: 4, nom: 'Remorquage', actif: 1 },
  { id: 5, nom: 'IT', actif: 1 },
  { id: 6, nom: 'Finance', actif: 1 },
  { id: 7, nom: 'RH', actif: 1 },
  { id: 8, nom: 'Commerce', actif: 1 },
  { id: 9, nom: 'Remboursement Medical', actif: 1 },
  { id: 10, nom: 'Remboursement Remorquage', actif: 1 },
  { id: 11, nom: 'Carglass', actif: 1 },
  { id: 12, nom: 'Comar', actif: 1 },
  { id: 13, nom: 'Vehicule de remplacement', actif: 1 },
  { id: 14, nom: 'Domiciliation', actif: 1 },
  { id: 15, nom: 'Reception', actif: 1 }
];

// Compatibilité avec les anciens composants.
export const DEPARTMENTS = DEPARTEMENTS.map(
    (departement) => departement.nom
);

// Identifiants des départements.
export const DEPT_IDS = {
  JURIDIQUE: 1,
  SERVICES_GENERAUX: 2,
  OPERATIONS: 3,
  REMORQUAGE: 4,
  IT: 5,
  FINANCE: 6,
  RH: 7,
  COMMERCE: 8,
  REMBOURSEMENT_MEDICAL: 9,
  REMBOURSEMENT_REMORQUAGE: 10,
  CARGLASS: 11,
  COMAR: 12,
  VEHICULE_REMPLACEMENT: 13,
  DOMICILIATION: 14,
  RECEPTION: 15
};

// =====================================================
// DEPARTEMENTS AUTORISES POUR RECEPTION
// =====================================================

export const RECEPTION_TARGET_DEPTS = [
  { id: 2, nom: 'Services generaux' },
  { id: 3, nom: 'Operations' },
  { id: 4, nom: 'Remorquage' },
  { id: 1, nom: 'Juridique' }
];

// =====================================================
// STATUTS ORACLE
// =====================================================

export const WORKFLOW_STATUS_IDS = {
  RECU: 1,
  EN_COURS: 21,
  EN_ATTENTE_VALIDATION: 22,
  VALIDE: 23,
  REJETE: 24,
  RETOUR_CORRECTION: 25,
  TRANSMIS_FINANCE: 26,
  PAYE: 27,
  ARCHIVE: 28
};

// Compatibilité avec les anciens composants.
export const WORKFLOW_STATUS = WORKFLOW_STATUS_IDS;

// =====================================================
// CONFIGURATION DES STATUTS
// =====================================================

export const STATUS_CONFIG = {
  1: {
    code: 'RECU',
    label: 'Document reçu',
    variant: 'blue',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE'
  },

  21: {
    code: 'EN_COURS',
    label: 'En cours de traitement',
    variant: 'warning',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A'
  },

  22: {
    code: 'EN_ATTENTE_VALIDATION',
    label: 'En attente de validation',
    variant: 'purple',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE'
  },

  23: {
    code: 'VALIDE',
    label: 'Document validé',
    variant: 'emerald',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },

  24: {
    code: 'REJETE',
    label: 'Document rejeté avec justification',
    variant: 'danger',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA'
  },

  25: {
    code: 'RETOUR_CORRECTION',
    label: 'Retourné pour correction',
    variant: 'orange',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA'
  },

  26: {
    code: 'TRANSMIS_FINANCE',
    label: 'Transmis au département Finance',
    variant: 'cyan',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC'
  },

  27: {
    code: 'PAYE',
    label: 'Paiement effectué',
    variant: 'success',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },

  28: {
    code: 'ARCHIVE',
    label: 'Archivé après traitement final',
    variant: 'neutral',
    color: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  }
};

// =====================================================
// ACTIONS DU WORKFLOW
// =====================================================

export const WORKFLOW_ACTIONS = {
  VALIDER: 'VALIDER',
  REJETER: 'REJETER',
  TRANSMETTRE: 'TRANSMETTRE'
};

// Paiement et archivage non activés dans le frontend.
export const DISABLED_WORKFLOW_ACTIONS = [
  'PAYER',
  'ARCHIVER'
];

// =====================================================
// FORMATS DE FICHIERS
// =====================================================

export const FILE_TYPES = {
  PDF: 'application/pdf',
  SIGNATURE_JPEG: 'image/jpeg'
};

// =====================================================
// CONFIGURATION DES FICHIERS
// =====================================================

export const FILE_CONFIG = {
  MAX_SIZE_MB: 15,
  MAX_SIZE_BYTES: 15 * 1024 * 1024,
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf'
  ]
};

// =====================================================
// CATEGORIES DES DOCUMENTS
// =====================================================

export const DOCUMENT_CATEGORIES = [
  { value: 'FACTURE', label: 'Facture' },
  { value: 'BON_COMMANDE', label: 'Bon de commande' },
  { value: 'DEVIS', label: 'Devis' },
  { value: 'JUSTIFICATIF', label: 'Justificatif' },
  { value: 'AUTRE', label: 'Autre' }
];
