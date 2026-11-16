
import apiClient from './api';
import {
  canUploadSignature,
  canUploadJustificatif,
} from '../utils/permissions';
import { validateDocumentUpload } from '../utils/validators';

const DEPARTEMENT_SERVICES_GENERAUX = 2;
const DEPARTEMENT_RECEPTION = 15;
const ROLE_ADMIN = 1;

const getDepartmentId = (user) =>
    Number(user?.departementId ?? user?.departmentId);

const getRoleId = (user) =>
    Number(user?.roleId);

const isAdmin = (user) =>
    getRoleId(user) === ROLE_ADMIN;

const getResponseData = (response) => response?.data ?? response;

/**
 * Récupère tous les documents accessibles à l'utilisateur connecté.
 * Le backend applique lui-même les restrictions par département.
 */
export const documentService = {

  async getAllDocuments(filters = {}) {
    const response = await apiClient.get('/documents', {
      params: filters,
    });

    return getResponseData(response);
  },

  /**
   * Récupère les documents d'un dossier.
   */
  async getDocumentsByDossier(dossierId) {
    if (!dossierId) {
      throw new Error('Identifiant du dossier manquant.');
    }

    const response = await apiClient.get(
        `/documents/dossier/${dossierId}`
    );

    return getResponseData(response);
  },

  /**
   * Récupère un document par son identifiant.
   */
  async getDocumentById(documentId) {
    if (!documentId) {
      throw new Error('Identifiant du document manquant.');
    }

    const response = await apiClient.get(
        `/documents/${documentId}`
    );

    return getResponseData(response);
  },

  /**
   * Crée le document métier associé à un dossier.
   * documentData doit respecter les champs de l'entité Document
   * et les validations du backend.
   */
  async createDocument(documentData) {
    if (!documentData) {
      throw new Error('Les informations du document sont obligatoires.');
    }

    const response = await apiClient.post(
        '/documents',
        documentData
    );

    return getResponseData(response);
  },

  /**
   * Recherche le document métier associé à un dossier.
   */
  async findDocumentIdByDossier(dossierId) {
    const documents = await this.getDocumentsByDossier(dossierId);

    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error(
          'Aucun document métier n’est encore associé à ce dossier. Crée d’abord le document.'
      );
    }

    if (documents.length > 1) {
      throw new Error(
          'Plusieurs documents sont associés à ce dossier. Précise le document concerné.'
      );
    }

    return documents[0].documentId;
  },

  /**
   * Ajoute une pièce jointe PDF ou une signature JPEG.
   *
   * FACTURE :
   * La facture initiale doit être déposée lors de la création
   * du document métier. Elle ne peut pas être ajoutée ici.
   *
   * JUSTIFICATIF :
   * Réservé à Services généraux.
   *
   * SIGNATURE :
   * Réservée au département actuellement responsable.
   */
  async uploadDocument(
      dossierId,
      category,
      file,
      currentUser,
      comment = ''
  ) {
    if (!dossierId) {
      throw new Error('Identifiant du dossier manquant.');
    }

    if (!file) {
      throw new Error('Veuillez sélectionner un fichier.');
    }

    if (!currentUser) {
      throw new Error('Utilisateur non authentifié.');
    }

    if (isAdmin(currentUser)) {
      throw new Error(
          'L’administrateur ne peut pas déposer de pièces jointes métier.'
      );
    }

    if (category === 'FACTURE') {
      throw new Error(
          'La facture originale doit être déposée lors de la création du document.'
      );
    }

    if (category === 'JUSTIFICATIF') {
      if (!canUploadJustificatif(currentUser)
          || getDepartmentId(currentUser) !== DEPARTEMENT_SERVICES_GENERAUX) {
        throw new Error(
            'Seul le département Services généraux peut ajouter des justificatifs.'
        );
      }
    } else if (category === 'SIGNATURE') {
      if (
          getDepartmentId(currentUser) === DEPARTEMENT_RECEPTION ||
          !canUploadSignature(currentUser, { dossierId })
      ) {
        throw new Error(
            'La réception ne peut pas signer. Seul le département responsable peut ajouter une signature.'
        );
      }
    } else {
      throw new Error('Catégorie de document non autorisée.');
    }

    const validation = validateDocumentUpload(file, category);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const documentId = await this.findDocumentIdByDossier(dossierId);

    const formData = new FormData();
    formData.append('fichier', file);

    let endpoint;

    if (category === 'JUSTIFICATIF') {
      endpoint =
          `/documents/${documentId}/pieces-jointes/pdf`;
    } else {
      endpoint =
          `/documents/${documentId}/pieces-jointes/signature`;
    }

    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return getResponseData(response);
  },

  /**
   * Récupère uniquement les pièces jointes ordinaires.
   * Le backend doit exclure les signatures de cette réponse.
   */
  async getAttachments(documentId) {
    if (!documentId) {
      throw new Error('Identifiant du document manquant.');
    }

    const response = await apiClient.get(
        `/documents/${documentId}/pieces-jointes`
    );

    return getResponseData(response);
  },

  /**
   * Télécharge une pièce jointe PDF avec authentification.
   * Ne jamais utiliser cette méthode pour récupérer une signature.
   */
  async downloadAttachment(documentId, pieceJointeId) {
    if (!documentId || !pieceJointeId) {
      throw new Error('Identifiants de la pièce jointe manquants.');
    }

    const response = await apiClient.get(
        `/documents/${documentId}/pieces-jointes/${pieceJointeId}/contenu`,
        {
          responseType: 'blob',
        }
    );

    return response.data;
  },
};

export default documentService;
