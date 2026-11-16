
import apiClient from './api';

const DEPARTEMENTS = {
  'JURIDIQUE': 1,
  'SERVICES GENERAUX': 2,
  'SERVICES GÉNÉRAUX': 2,
  'OPERATIONS': 3,
  'OPÉRATIONS': 3,
  'REMORQUAGE': 4,
  'FINANCE': 6,
  'RECEPTION': 15,
  'RÉCEPTION': 15,
};

const getResponseData = (response) => response?.data ?? response;

const normalizeDepartmentId = (department) => {
  if (department === null || department === undefined) {
    return null;
  }

  const numericId = Number(department);

  if (Number.isInteger(numericId) && numericId > 0) {
    return numericId;
  }

  const normalizedName = String(department)
      .trim()
      .toUpperCase();

  return DEPARTEMENTS[normalizedName] ?? null;
};

const getDocumentId = async (dossierId) => {
  const response = await apiClient.get(
      `/documents/dossier/${dossierId}`
  );

  const documents = getResponseData(response);

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error(
        'Aucun document métier trouvé pour ce dossier.'
    );
  }

  if (documents.length > 1) {
    throw new Error(
        'Plusieurs documents sont associés à ce dossier. Le document doit être identifié précisément.'
    );
  }

  const documentId =
      documents[0].documentId ?? documents[0].id;

  if (!documentId) {
    throw new Error(
        'Identifiant du document introuvable dans la réponse du backend.'
    );
  }

  return documentId;
};

export const workflowService = {

  /**
   * Exécute une transmission ou une décision métier.
   *
   * Actions disponibles :
   * TRANSMIT       : transmission initiale depuis Reception.
   * VALIDATE       : décision VALIDER.
   * REJECT         : décision REJETER.
   * TRANSMIT_FINANCE : validation avec destination Finance.
   *
   * Les autorisations définitives sont contrôlées par le backend.
   */
  async executeTransition(
      dossierId,
      actionPayload = {},
      currentUser
  ) {
    if (!dossierId) {
      throw new Error('Identifiant du dossier manquant.');
    }

    if (!currentUser) {
      throw new Error('Utilisateur non authentifié.');
    }

    const actionId = String(
        actionPayload.actionId ?? ''
    ).trim().toUpperCase();

    const justification =
        actionPayload.justification?.trim() ?? '';

    const destination = normalizeDepartmentId(
        actionPayload.destinationDepartmentId ??
        actionPayload.destinationDepartementId ??
        actionPayload.targetDepartmentId ??
        actionPayload.targetDepartment
    );

    /*
     * 1. Transmission initiale depuis Reception.
     */
    if (actionId === 'TRANSMIT') {
      if (!destination) {
        throw new Error(
            'Le département de destination est obligatoire.'
        );
      }

      const response = await apiClient.post(
          `/dossiers/${dossierId}/transmettre`,
          null,
          {
            params: {
              departementId: destination,
            },
          }
      );

      return getResponseData(response);
    }

    /*
     * 2. Identification de la décision métier.
     */
    let action;

    if (
        actionId === 'VALIDATE' ||
        actionId === 'VALIDER'
    ) {
      action = 'VALIDER';
    } else if (
        actionId === 'REJECT' ||
        actionId === 'REJETER'
    ) {
      action = 'REJETER';
    } else if (actionId === 'TRANSMIT_FINANCE') {
      action = 'VALIDER';
    } else {
      throw new Error(
          `Action non prise en charge par le backend : ${actionId || 'vide'}.`
      );
    }

    /*
     * 3. Vérification des données obligatoires.
     */
    if (action === 'REJETER' && !justification) {
      throw new Error(
          'Une justification est obligatoire pour rejeter un document.'
      );
    }

    if (
        actionId === 'TRANSMIT_FINANCE' &&
        destination === null
    ) {
      // La destination Finance est définie par défaut
      // pour cette action spécifique.
    }

    const destinationDepartementId =
        actionId === 'TRANSMIT_FINANCE'
            ? 6
            : destination;

    /*
     * 4. Récupération du document associé au dossier.
     */
    const documentId = await getDocumentId(dossierId);

    /*
     * 5. Appel du véritable endpoint de décision.
     *
     * Le backend récupère lui-même l'utilisateur connecté.
     * Ne pas envoyer utilisateurId depuis le frontend.
     */
    const response = await apiClient.post(
        `/documents/${documentId}/decision`,
        {
          action,
          justification,
          destinationDepartementId,
        }
    );

    return getResponseData(response);
  },

  /**
   * Récupère l'historique d'un document.
   */
  async getDocumentHistory(documentId) {
    if (!documentId) {
      throw new Error('Identifiant du document manquant.');
    }

    const response = await apiClient.get(
        `/historique/document/${documentId}`
    );

    return getResponseData(response);
  },

  /**
   * Récupère l'historique des transmissions d'un dossier.
   */
  async getDossierTransmissionHistory(dossierId) {
    if (!dossierId) {
      throw new Error('Identifiant du dossier manquant.');
    }

    const response = await apiClient.get(
        `/transmissions/dossier/${dossierId}`
    );

    return getResponseData(response);
  },

  /**
   * Construit un historique global à partir des endpoints existants.
   *
   * Les résultats restent soumis aux restrictions du backend.
   * L'accès à l'historique est notamment interdit à Reception
   * et à ADMIN.
   */
  async getGlobalHistory(filters = {}) {
    const dossierResponse = await apiClient.get('/dossiers');

    const dossierData = getResponseData(dossierResponse);

    const dossiers = Array.isArray(dossierData)
        ? dossierData
        : dossierData?.items ?? [];

    const historyRequests = dossiers.map(async (dossier) => {
      const dossierId = dossier.dossierId ?? dossier.id;

      if (!dossierId) {
        return [];
      }

      const results = [];

      /*
       * Historique des transmissions.
       */
      try {
        const transmissions =
            await this.getDossierTransmissionHistory(dossierId);

        if (Array.isArray(transmissions)) {
          results.push(
              ...transmissions.map((item) => ({
                ...item,
                dossierId,
                dossierRef:
                    dossier.reference ??
                    dossier.nomDossier ??
                    String(dossierId),
                historyType: 'TRANSMISSION',
                timestamp:
                    item.dateTransmission ??
                    item.dateAction ??
                    item.timestamp,
              }))
          );
        }
      } catch (error) {
        if (error.response?.status === 403) {
          throw error;
        }
        throw error;
      }

      /*
       * Historique des documents du dossier.
       */
      const documentsResponse = await apiClient.get(
          `/documents/dossier/${dossierId}`
      );

      const documents = getResponseData(documentsResponse);

      if (!Array.isArray(documents)) {
        return results;
      }

      for (const document of documents) {
        const documentId =
            document.documentId ?? document.id;

        if (!documentId) {
          continue;
        }

        const documentHistory =
            await this.getDocumentHistory(documentId);

        if (Array.isArray(documentHistory)) {
          results.push(
              ...documentHistory.map((item) => ({
                ...item,
                documentId,
                dossierId,
                dossierRef:
                    dossier.reference ??
                    dossier.nomDossier ??
                    String(dossierId),
                historyType: 'DOCUMENT',
                timestamp:
                    item.dateAction ??
                    item.timestamp,
              }))
          );
        }
      }

      return results;
    });

    const historyGroups = await Promise.all(historyRequests);

    let history = historyGroups.flat();

    if (filters.action && filters.action !== 'ALL') {
      history = history.filter(
          (item) => item.action === filters.action
      );
    }

    if (filters.search?.trim()) {
      const query = filters.search.trim().toLowerCase();

      history = history.filter((item) => {
        const searchableText = [
          item.dossierRef,
          item.action,
          item.details,
          item.commentaire,
          item.comment,
          item.utilisateur,
          item.nomUtilisateur,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return searchableText.includes(query);
      });
    }

    history.sort(
        (a, b) =>
            new Date(b.timestamp ?? 0).getTime() -
            new Date(a.timestamp ?? 0).getTime()
    );

    return history;
  },
};

export default workflowService;
