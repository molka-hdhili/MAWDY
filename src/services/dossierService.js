import apiClient from './api';
import {
  isReception,
  isFinance,
  isAdmin,
} from '../utils/permissions';
import { DEPT_IDS } from '../utils/constants';
import { STATUS_CONFIG } from '../utils/constants';

/* =========================================================
   HELPERS
========================================================= */

const unwrapResponse = (response) => {
  let data = response?.data ?? response;

  if (
      data &&
      !Array.isArray(data) &&
      Array.isArray(data.data)
  ) {
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

const normalizeDossier = (dossier = {}) => {
  const dossierId =
      dossier.dossierId ??
      dossier.id ??
      dossier.dossier?.dossierId ??
      dossier.dossier?.id ??
      null;

  return {
    ...dossier,

    id: dossierId,
    dossierId,

    nomDossier:
        dossier.nomDossier ??
        dossier.nom ??
        dossier.reference ??
        dossier.dossierRef ??
        '',

    description: dossier.description ?? '',

    departementOrigineId:
        dossier.departementOrigineId ??
        dossier.departementOrigine?.departementId ??
        dossier.departementOrigine?.id ??
        null,

    departementActuelId:
        dossier.departementActuelId ??
        dossier.departementActuel?.departementId ??
        dossier.departementActuel?.id ??
        null,

    nomDepartementActuel:
        dossier.nomDepartementActuel ??
        (typeof dossier.departementActuel === 'string' ? dossier.departementActuel : null) ??
        dossier.departementActuel?.nomDepartement ??
        dossier.departementActuel?.nom ??
        '',

    creePar:
        dossier.creePar ??
        dossier.utilisateurCreateurId ??
        dossier.createur?.utilisateurId ??
        dossier.utilisateurCreateur?.utilisateurId ??
        null,

    dateCreation:
        dossier.dateCreation ??
        dossier.dateArrivee ??
        null,

    // Conserver la relation calculée par le backend.
    typeRelation: dossier.typeRelation ?? null,
    statut: dossier.statut ?? dossier.status ?? null,
  };
};

const normalizeDocument = (document = {}) => ({
  ...document,

  documentId:
      document.documentId ??
      document.id ??
      null,

  dossierId:
      document.dossierId ??
      document.dossier?.dossierId ??
      document.dossier?.id ??
      null,

  montant: Number(document.montant ?? 0),

  devise: document.devise ?? 'TND',
});

const getErrorMessage = (
    error,
    fallback = 'Une erreur est survenue.'
) => {
  const responseData = error?.response?.data;

  return (
      responseData?.message ||
      responseData?.error ||
      responseData?.detail ||
      error?.message ||
      fallback
  );
};

/* =========================================================
   NORMALISATION DU DEPARTEMENT DESTINATAIRE
========================================================= */

const DESTINATION_DEPARTMENTS = {
  juridique: 1,
  'services generaux': 2,
  operations: 3,
  remorquage: 4,
  finance: 6,
};

const normalizeDepartmentName = (value) =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const normalizeDestinationDepartment = (formData) => {
  const value =
      formData?.destinationDepartmentId ??
      formData?.destinationDepartementId ??
      formData?.destinationDeptId ??
      formData?.targetDepartmentId ??
      formData?.destinationDepartment ??
      formData?.destination ??
      formData?.departementId;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);

  if (
      Number.isInteger(numericValue) &&
      [1, 2, 3, 4, 6].includes(numericValue)
  ) {
    return numericValue;
  }

  const normalizedName = normalizeDepartmentName(value);

  return DESTINATION_DEPARTMENTS[normalizedName] ?? null;
};

/* =========================================================
   SERVICE DOSSIER
========================================================= */

export const dossierService = {

  /* -------------------------------------------------------
     RECUPERER LES DOSSIERS
  ------------------------------------------------------- */

  async getDossiers(currentUser, filters = {}) {
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié.');
    }

    try {
      const response = await apiClient.get('/dossiers');

      const dossiers = normalizeList(response)
          .map(normalizeDossier)
          .filter((dossier) => dossier.dossierId !== null);

      const enriched = await Promise.all(
          dossiers.map(async (dossier) => {
            try {
              const documentsResponse = await apiClient.get(
                  `/documents/dossier/${dossier.dossierId}`
              );

              const documents = normalizeList(documentsResponse)
                  .map(normalizeDocument);

              return {
                ...dossier,
                document: documents[0] ?? null,
                documents,
              };
            } catch (error) {
              if (
                  error?.response?.status === 403 ||
                  error?.response?.status === 404
              ) {
                return {
                  ...dossier,
                  document: null,
                  documents: [],
                };
              }

              throw error;
            }
          })
      );

      return this.filterByRole(
          enriched,
          currentUser,
          filters
      );
    } catch (error) {
      throw new Error(
          getErrorMessage(
              error,
              'Impossible de récupérer les dossiers.'
          )
      );
    }
  },

  /* -------------------------------------------------------
     FILTRAGE SELON LE ROLE ET LE DEPARTEMENT
  ------------------------------------------------------- */

  filterByRole(dossiers, user, filters = {}) {
    if (!user) return [];

    let result = [...dossiers];

    if (isAdmin(user)) {
      // ADMIN : consultation globale en lecture seule.
      result = [...dossiers];

    } else if (isReception(user)) {
      /*
       * IMPORTANT :
       * Le backend retourne uniquement les dossiers auxquels
       * la Réception a légitimement accès.
       *
       * Il faut conserver les dossiers transmis, même lorsque
       * leur département actuel n'est plus la Réception.
       *
       * Le champ typeRelation permet ensuite de distinguer :
       * AFFECTE  = encore à la Réception
       * TRANSMIS = transmis par la Réception
       */
      result = [...dossiers];

    } else if (isFinance(user)) {
      result = result.filter(
          (dossier) =>
              Number(dossier.departementActuelId) ===
              Number(DEPT_IDS.FINANCE)
      );

    } else {
      result = result.filter(
          (dossier) =>
              Number(dossier.departementActuelId) ===
              Number(user.departementId)
      );
    }

    // Recherche
    if (filters.search?.trim()) {
      const query = filters.search.trim().toLowerCase();

      result = result.filter((dossier) => {
        const document = dossier.document;

        return (
            dossier.nomDossier?.toLowerCase().includes(query) ||
            dossier.description?.toLowerCase().includes(query) ||
            document?.numeroFacture?.toLowerCase().includes(query) ||
            document?.fournisseur?.toLowerCase().includes(query)
        );
      });
    }

    // Filtre par statut
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((dossier) => {
        const status =
            dossier.statutId ??
            dossier.document?.statutId ??
            dossier.statut;

        const selected = String(filters.status).toUpperCase();
        return String(status).toUpperCase() === selected ||
            STATUS_CONFIG[filters.status]?.code === String(status).toUpperCase();
      });
    }

    // Filtre par département actuel
    if (filters.departmentId) {
      result = result.filter(
          (dossier) =>
              Number(dossier.departementActuelId) ===
              Number(filters.departmentId)
      );
    }

    return result;
  },

  async getTransmittedByReception(currentUser) {
    if (!isReception(currentUser)) {
      throw new Error('Cette consultation est réservée au département Réception.');
    }
    const response = await apiClient.get('/dossiers/transmis-reception');
    const dossiers = normalizeList(response).map(normalizeDossier);
    return Promise.all(dossiers.map(async (dossier) => {
      try {
        const docs = normalizeList(await apiClient.get(`/documents/dossier/${dossier.dossierId}`)).map(normalizeDocument);
        return { ...dossier, document: docs[0] ?? null, documents: docs };
      } catch (error) {
        if (error?.response?.status === 403 || error?.response?.status === 404) return { ...dossier, document: null, documents: [] };
        throw error;
      }
    }));
  },

  /* -------------------------------------------------------
     RECUPERER UN DOSSIER PAR ID
  ------------------------------------------------------- */

  async getDossierById(dossierId, currentUser) {
    if (!dossierId) {
      throw new Error('Identifiant du dossier manquant.');
    }

    if (!currentUser) {
      throw new Error('Utilisateur non authentifié.');
    }

    const dossierResponse = await apiClient.get(`/dossiers/${dossierId}`);
    const dossier = normalizeDossier(unwrapResponse(dossierResponse));

    if (!dossier.dossierId) throw new Error('Dossier introuvable ou accès non autorisé.');

    const documentsResponse = await apiClient.get(
        `/documents/dossier/${dossierId}`
    );

    const documents = normalizeList(documentsResponse)
        .map(normalizeDocument);

    return {
      ...dossier,
      document: documents[0] ?? null,
      documents,
    };
  },

  async payDossier(dossierId) {
    if (!dossierId) throw new Error('Dossier introuvable.');
    return unwrapResponse(await apiClient.post(`/dossiers/${dossierId}/payer`));
  },

  async archiveDossier(dossierId) {
    if (!dossierId) throw new Error('Dossier introuvable.');
    return unwrapResponse(await apiClient.post(`/dossiers/${dossierId}/archiver`));
  },

  /* -------------------------------------------------------
     CREER UN DOSSIER
  ------------------------------------------------------- */

  async createDossier(formData, file) {
    return this.createAndSubmitDossier(formData, file);
  },

  /* -------------------------------------------------------
     CREER ET TRANSMETTRE UN DOSSIER
  ------------------------------------------------------- */

  async createAndSubmitDossier(formData, file) {
    if (!formData) {
      throw new Error(
          'Les informations du dossier sont obligatoires.'
      );
    }

    const dossierReference = String(
        formData.dossierRef ?? ''
    )
        .trim()
        .toUpperCase();

    const description = String(
        formData.description ?? ''
    ).trim();

    const destinationDeptId =
        normalizeDestinationDepartment(formData);

    if (!dossierReference || !description) {
      throw new Error(
          'La référence et la description du dossier sont obligatoires.'
      );
    }

    if (!destinationDeptId) {
      throw new Error(
          'Département destinataire invalide. Choisissez Juridique, Services généraux, Operations, Remorquage ou Finance.'
      );
    }

    if (!file) {
      throw new Error(
          'Le fichier PDF obligatoire est manquant.'
      );
    }

    const isPdf =
        file.type === 'application/pdf' ||
        file.name?.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      throw new Error(
          'Seuls les fichiers PDF sont acceptés.'
      );
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error(
          'Le fichier ne doit pas dépasser 15 Mo.'
      );
    }

    if (!formData.supplier?.trim()) {
      throw new Error(
          'Le nom du fournisseur est obligatoire.'
      );
    }

    if (!formData.invoiceNumber?.trim()) {
      throw new Error(
          'Le numéro de facture est obligatoire.'
      );
    }

    if (
        !Number.isFinite(Number(formData.amount)) ||
        Number(formData.amount) <= 0
    ) {
      throw new Error(
          'Le montant de la facture doit être supérieur à zéro.'
      );
    }

    if (!formData.invoiceDate) {
      throw new Error(
          'La date de facture est obligatoire.'
      );
    }

    try {
      // 1. Création du dossier.
      const dossierResponse = await apiClient.post(
          '/dossiers',
          {
            nomDossier: dossierReference,
            description,
          }
      );

      const newDossier = unwrapResponse(dossierResponse);

      const dossierId =
          newDossier?.dossierId ??
          newDossier?.id;

      if (!dossierId) {
        throw new Error(
            'Le backend n’a pas retourné l’identifiant du dossier.'
        );
      }

      // 2. Création du document initial.
      const documentResponse = await apiClient.post(
          '/documents',
          {
            referenceDocument: `DOC-${dossierReference}`,
            typeDocument: 'FACTURE',
            objet: description,
            fournisseur: formData.supplier.trim(),
            numeroFacture: formData.invoiceNumber
                .trim()
                .toUpperCase(),
            montant: Number(formData.amount),
            devise: 'TND',
            dateFacture: formData.invoiceDate,
            dossierId,
          }
      );

      const document = unwrapResponse(documentResponse);

      const documentId =
          document?.documentId ??
          document?.id;

      if (!documentId) {
        throw new Error(
            'Le backend n’a pas retourné l’identifiant du document.'
        );
      }

      // 3. Téléversement de la facture originale PDF.
      const fileData = new FormData();
      fileData.append('fichier', file);

      await apiClient.post(
          `/documents/${documentId}/pieces-jointes/pdf`,
          fileData
      );

      // 4. Transmission initiale par la Réception.
      await apiClient.post(
          `/dossiers/${dossierId}/transmettre`,
          null,
          {
            params: {
              departementId: destinationDeptId,
            },
          }
      );

      const normalizedDossier = normalizeDossier(newDossier);
      const normalizedDocument = normalizeDocument(document);

      return {
        ...normalizedDossier,
        id: dossierId,
        dossierId,
        reference:
            normalizedDossier.nomDossier ||
            dossierReference,
        document: normalizedDocument,
        documents: [normalizedDocument],
      };

    } catch (error) {
      console.error(
          'Erreur createAndSubmitDossier :',
          error
      );

      throw new Error(
          getErrorMessage(
              error,
              'Impossible de créer et transmettre le dossier.'
          )
      );
    }
  },

  /* -------------------------------------------------------
     ENREGISTRER UNE DECISION
  ------------------------------------------------------- */

  async submitDecision(
      dossierId,
      documentId,
      action,
      payload = {},
      signatureFile = null
  ) {
    if (!dossierId || !documentId) {
      throw new Error(
          'Dossier ou document introuvable.'
      );
    }

    const normalizedAction = String(action || '')
        .trim()
        .toUpperCase();

    if (!['VALIDER', 'REJETER'].includes(normalizedAction)) {
      throw new Error('Action non autorisée.');
    }

    const justification =
        payload.justification?.trim() || null;

    const destinationDepartementId =
        payload.destinationDepartementId
            ? Number(payload.destinationDepartementId)
            : null;

    if (
        normalizedAction === 'REJETER' &&
        !justification
    ) {
      throw new Error(
          'La justification du rejet est obligatoire.'
      );
    }

    if (normalizedAction === 'VALIDER' && !signatureFile) {
      throw new Error('Une signature JPEG est obligatoire avant la validation.');
    }

    try {
      // La signature est envoyée uniquement au backend.
      // Elle ne doit pas être exposée dans les listes ordinaires.
      if (normalizedAction === 'VALIDER') {
        const isJpeg =
            (signatureFile.type === 'image/jpeg' || !signatureFile.type) &&
            /\.(jpe?g)$/i.test(signatureFile.name || '');

        if (!isJpeg) {
          throw new Error(
              'La signature doit être une image JPEG.'
          );
        }

        const signatureData = new FormData();
        signatureData.append('fichier', signatureFile);

        await apiClient.post(
            `/documents/${documentId}/pieces-jointes/signature`,
            signatureData
        );
      }

      const response = await apiClient.post(
          `/documents/${documentId}/decision`,
          {
            action: normalizedAction,
            justification,
            destinationDepartementId,
          }
      );

      return unwrapResponse(response);

    } catch (error) {
      throw new Error(
          getErrorMessage(
              error,
              'Impossible d’enregistrer la décision.'
          )
      );
    }
  },

  /* -------------------------------------------------------
     NOM DU DEPARTEMENT
  ------------------------------------------------------- */

  getDeptNameById(deptId) {
    const departments = {
      1: 'Juridique',
      2: 'Services généraux',
      3: 'Operations',
      4: 'Remorquage',
      5: 'IT',
      6: 'Finance',
      7: 'RH',
      8: 'Commercial',
      15: 'Reception',
    };

    return (
        departments[Number(deptId)] ||
        `Département #${deptId}`
    );
  },
};

export default dossierService;
