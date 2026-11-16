

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  User,
  Calendar,
  Banknote,
  CreditCard,
  Archive,
  Send,
  Shield,
  UploadCloud,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import dossierService from '../../services/dossierService';
import documentService from '../../services/documentService';
import workflowService from '../../services/workflowService';

import Button from '../../components/common/Button';
import DossierStatusBadge from '../../components/dossiers/DossierStatusBadge';
import {
  Card,
  CardHeader,
  CardBody,
} from '../../components/common/Card';

// Départements autorisés pour la transmission initiale par la Réception.
const RECEPTION_DESTINATIONS = [
  { id: 1, name: 'Juridique' },
  { id: 2, name: 'Services généraux' },
  { id: 3, name: 'Operations' },
  { id: 4, name: 'Remorquage' },
  { id: 6, name: 'Finance' },
];

// Départements possibles pour une validation par Services généraux.
// Le backend reste responsable de vérifier les destinations autorisées.
const VALIDATION_DESTINATIONS = [
  { id: 3, name: 'Operations' },
  { id: 5, name: 'IT' },
  { id: 6, name: 'Finance' },
  { id: 7, name: 'RH' },
  { id: 8, name: 'Commerce' },
];

const STATUS_LABELS = {
  1: 'Reçu',
  21: 'En cours',
  22: 'En attente de validation',
  23: 'Validé',
  24: 'Rejeté',
  25: 'Retour pour correction',
  26: 'Transmis à Finance',
  27: 'Payé',
  28: 'Archivé',

  RECU: 'Reçu',
  EN_COURS: 'En cours',
  EN_ATTENTE_VALIDATION: 'En attente de validation',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  RETOUR_CORRECTION: 'Retour pour correction',
  TRANSMIS_FINANCE: 'Transmis à Finance',
  PAYE: 'Payé',
  ARCHIVE: 'Archivé',
};

const normalize = (value) =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const getResponseData = (response) =>
    response?.data ?? response;

const getArray = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;

  return [];
};

const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;

  return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      error?.userMessage ||
      error?.message ||
      'Une erreur est survenue. Veuillez réessayer.'
  );
};

const getUserDepartmentId = (user) =>
    Number(user?.departmentId ?? user?.departementId ?? 0);

const getUserDepartment = (user) =>
    user?.departmentName ||
    user?.departementName ||
    user?.department ||
    user?.departement ||
    '';

const getUserRole = (user) =>
    user?.roleName ||
    user?.role ||
    user?.authority ||
    '';

const isReceptionUser = (user) =>
    getUserDepartmentId(user) === 15 ||
    normalize(getUserDepartment(user)).includes('reception');

const isAdminUser = (user) =>
    Number(user?.roleId) === 1 ||
    normalize(getUserRole(user)).includes('admin');

const isFinanceUser = (user) =>
    Number(user?.roleId) === 4 ||
    normalize(getUserRole(user)).includes('finance') ||
    getUserDepartmentId(user) === 6;

const isServicesGenerauxUser = (user) =>
    getUserDepartmentId(user) === 2 ||
    normalize(getUserDepartment(user)).includes('services generaux');

const formatDate = (value) => {
  if (!value) return 'Non renseignée';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('fr-TN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'Non renseignée';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('fr-TN');
};

// Tous les montants de l'application sont exprimés en dinars tunisiens.
const formatTND = (value) => {
  if (
      value === null ||
      value === undefined ||
      value === ''
  ) {
    return 'Non renseigné';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'Non renseigné';
  }

  return `${amount.toLocaleString('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} TND`;
};

const getStatusLabel = (status) =>
    STATUS_LABELS[status] || status || 'Non renseigné';

const getDepartmentName = (id) => {
  const departments = {
    1: 'Juridique',
    2: 'Services généraux',
    3: 'Operations',
    4: 'Remorquage',
    5: 'IT',
    6: 'Finance',
    7: 'RH',
    8: 'Commerce',
    15: 'Reception',
  };

  return departments[Number(id)] || 'Non affecté';
};

const getDocumentId = (document) =>
    document?.documentId ?? document?.id ?? null;

const getAttachmentId = (attachment) =>
    attachment?.pieceJointeId ??
    attachment?.id ??
    null;

const getAttachmentName = (attachment) =>
    attachment?.nomFichier ||
    attachment?.fileName ||
    attachment?.name ||
    'Document sans nom';

const getActionId = (action) => {
  if (typeof action === 'string') return action;

  return (
      action?.actionId ||
      action?.id ||
      action?.value ||
      action?.action ||
      ''
  ).toString().toUpperCase();
};

const getActionLabel = (action) => {
  const actionId = getActionId(action);

  const labels = {
    VALIDATE: 'Valider',
    VALIDER: 'Valider',
    REJECT: 'Rejeter',
    REJETER: 'Rejeter',
  };

  return (
      action?.label ||
      action?.libelle ||
      labels[actionId] ||
      actionId
  );
};

const normalizeHistoryEntry = (entry, type) => {
  if (type === 'document') {
    const actionId = String(entry?.action || '').toUpperCase();
    const actionLabels = {
      VALIDER: 'Document validé', VALIDATION: 'Document validé',
      REJETER: 'Document rejeté', REJET: 'Document rejeté',
      TRANSMISSION: 'Transmission du document', MODIFICATION: 'Document modifié',
    };
    return {
      id: entry?.historiqueId,
      action: actionLabels[actionId] || entry?.action || 'Action sur le document',
      date: entry?.dateAction,
      user: entry?.utilisateurId
          ? `Utilisateur #${entry.utilisateurId}`
          : '',
      details: entry?.details || '',
    };
  }

  return {
    id: entry?.transmissionId,
    action: 'Transmission du dossier',
    date: entry?.dateTransmission,
    user: entry?.utilisateur || (entry?.utilisateurId ? `Utilisateur #${entry.utilisateurId}` : ''),
    details: entry?.commentaire || entry?.details || '',
    fromDepartment: entry?.departementSource || (entry?.departementSourceId ? getDepartmentName(entry.departementSourceId) : ''),
    toDepartment: entry?.departementDestination || (entry?.departementDestinationId ? getDepartmentName(entry.departementDestinationId) : ''),
  };
};

const DossierDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    user,
    canSign,
    canAddJustificatif,
    getActionsForDossier,
  } = useAuth();

  const { showSuccess, showError } = useToast();

  const [dossier, setDossier] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('JUSTIFICATIF');
  const [uploading, setUploading] = useState(false);

  const [selectedAction, setSelectedAction] = useState('');
  const [decisionSignature, setDecisionSignature] = useState(null);
  const [targetDepartment, setTargetDepartment] = useState('');
  const [justification, setJustification] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [archiveProcessing, setArchiveProcessing] = useState(false);

  const isReception = isReceptionUser(user);
  const isAdmin = isAdminUser(user);
  const isFinance = isFinanceUser(user);
  const isServicesGeneraux = isServicesGenerauxUser(user);

  const loadDossier = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError('');

      if (!user) {
        throw new Error('Utilisateur non authentifié.');
      }

      // Le service récupère uniquement les dossiers autorisés.
      const result = await dossierService.getDossierById(
          id,
          user
      );

      if (!result) {
        throw new Error('Dossier introuvable.');
      }

      setDossier(result);

      // Récupération des documents depuis le backend.
      const documentResponse =
          await documentService.getDocumentsByDossier(
              result.dossierId ?? id
          );

      const backendDocuments = getArray(documentResponse);

      // Récupération des pièces jointes PDF accessibles.
      // Les signatures ne sont pas retournées par cet endpoint.
      const enrichedDocuments = await Promise.all(
          backendDocuments.map(async (document) => {
            const documentId = getDocumentId(document);

            if (!documentId) {
              return {
                ...document,
                attachments: [],
              };
            }

            try {
              const attachmentsResponse =
                  await documentService.getAttachments(
                      documentId
                  );

              const attachments = getArray(
                  attachmentsResponse
              ).filter((attachment) => {
                const mime = normalize(
                    attachment?.typeMime ||
                    attachment?.mimeType ||
                    ''
                );

                const name = getAttachmentName(attachment);

                return (
                    mime === 'application/pdf' ||
                    name.toLowerCase().endsWith('.pdf')
                );
              });

              return {
                ...document,
                attachments,
              };
            } catch (error) {
              // Une erreur de pièces jointes ne doit pas
              // supprimer les informations du document.
              return {
                ...document,
                attachments: [],
              };
            }
          })
      );

      setDocuments(enrichedDocuments);

      // Pas d'historique interne pour la Réception ni l'Admin.
      if (!isAdmin) {
        const documentId = getDocumentId(
            enrichedDocuments[0]
        );

        const historyRequests = [];

        if (documentId) {
          historyRequests.push(
              workflowService
                  .getDocumentHistory(documentId)
                  .then((response) =>
                      getArray(response).map((entry) =>
                          normalizeHistoryEntry(
                              entry,
                              'document'
                          )
                      )
                  )
          );
        }

        historyRequests.push(
            workflowService
                .getDossierTransmissionHistory(
                    result.dossierId ?? id
                )
                .then((response) =>
                    getArray(response).map((entry) =>
                        normalizeHistoryEntry(
                            entry,
                            'transmission'
                        )
                    )
                )
        );

        const historyResults = await Promise.allSettled(
            historyRequests
        );

        const combinedHistory = historyResults
            .filter((item) => item.status === 'fulfilled')
            .flatMap((item) => item.value);

        combinedHistory.sort(
            (a, b) =>
                new Date(b.date || 0).getTime() -
                new Date(a.date || 0).getTime()
        );

        setHistory(combinedHistory);
      } else {
        setHistory([]);
      }
    } catch (error) {
      setPageError(getErrorMessage(error));
      setDossier(null);
      setDocuments([]);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, isReception, isAdmin]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  const currentDocument = documents[0] ?? null;

  const dossierId =
      dossier?.dossierId ??
      dossier?.id ??
      id;

  const documentId = getDocumentId(currentDocument);

  const dossierStatus =
      getStatusLabel(
          currentDocument?.statutId ??
          dossier?.statutId ??
          dossier?.statut
      );

  const currentDepartmentId =
      dossier?.departementActuelId ??
      currentDocument?.departementActuelId;

  const department =
      dossier?.nomDepartementActuel ||
      dossier?.departementActuel?.nomDepartement ||
      getDepartmentName(currentDepartmentId);

  // Actions de décision réellement prises en charge par le backend.
  const availableActions = useMemo(() => {
    if (
        !dossier ||
        isReception ||
        isAdmin ||
        typeof getActionsForDossier !== 'function'
    ) {
      return [];
    }

    const actions = getActionsForDossier(dossier);

    if (!Array.isArray(actions)) return [];

    return actions.filter((action) =>
        ['VALIDATE', 'VALIDER', 'REJECT', 'REJETER'].includes(
            getActionId(action)
        )
    );
  }, [
    dossier,
    isReception,
    isAdmin,
    getActionsForDossier,
  ]);

  const canUploadPdfJustificatif =
      !isReception &&
      !isAdmin &&
      isServicesGeneraux &&
      (
          typeof canAddJustificatif !== 'function' ||
          canAddJustificatif(dossier)
      );

  const canUploadJpegSignature =
      !isReception &&
      !isAdmin &&
      typeof canSign === 'function' &&
      canSign(dossier);

  // Business attachment uploads are restricted to General Services.
  // La signature reste disponible uniquement dans le formulaire de d?cision.
  const canUploadDocument = canUploadPdfJustificatif;

  // Si l'utilisateur ne peut ajouter qu'un seul type de fichier,
  // sélectionner automatiquement le type autorisé.
  useEffect(() => {
    if (canUploadPdfJustificatif && !canUploadJpegSignature) {
      setUploadCategory('JUSTIFICATIF');
      setSelectedFile(null);
    }
  }, [canUploadPdfJustificatif]);

  const canReceptionTransmit =
      isReception &&
      !isAdmin &&
      Number(currentDepartmentId) === 15;

  const requiresJustification =
      ['REJECT', 'REJETER'].includes(selectedAction);

  const requiresValidationDestination =
      selectedAction &&
      ['VALIDATE', 'VALIDER'].includes(selectedAction) &&
      isServicesGeneraux;

  const requiresFinanceRejectionDestination =
      selectedAction &&
      ['REJECT', 'REJETER'].includes(selectedAction) &&
      isFinance;

  const destinationOptions = useMemo(() => {
    if (canReceptionTransmit) {
      return RECEPTION_DESTINATIONS;
    }

    if (requiresValidationDestination) {
      return VALIDATION_DESTINATIONS.filter(
          (departmentItem) =>
              departmentItem.id !== Number(currentDepartmentId)
      );
    }

    if (requiresFinanceRejectionDestination) {
      return [
        { id: 2, name: 'Services généraux' },
      ];
    }

    return [];
  }, [
    canReceptionTransmit,
    requiresValidationDestination,
    requiresFinanceRejectionDestination,
    currentDepartmentId,
  ]);

  const requiresDestination =
      canReceptionTransmit ||
      requiresValidationDestination ||
      requiresFinanceRejectionDestination;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

    const isJpeg =
        file.type === 'image/jpeg' ||
        /\.(jpe?g)$/i.test(file.name);

    if (
        uploadCategory === 'JUSTIFICATIF' &&
        !isPdf
    ) {
      showError('Le justificatif doit être un fichier PDF.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (
        uploadCategory === 'SIGNATURE' &&
        !isJpeg
    ) {
      showError('La signature doit être une image JPEG.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showError(
          'La taille du fichier ne doit pas dépasser 15 Mo.'
      );
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!dossier || !selectedFile || uploading) return;

    if (!documentId) {
      showError(
          'Aucun document métier n’est associé à ce dossier.'
      );
      return;
    }

    if (
        uploadCategory === 'JUSTIFICATIF' &&
        !canUploadPdfJustificatif
    ) {
      showError(
          'Tu ne disposes pas de la permission pour ajouter un justificatif.'
      );
      return;
    }

    if (
        uploadCategory === 'SIGNATURE' &&
        !canUploadJpegSignature
    ) {
      showError(
          'Tu ne disposes pas de la permission pour ajouter une signature.'
      );
      return;
    }

    try {
      setUploading(true);

      await documentService.uploadDocument(
          dossierId,
          uploadCategory,
          selectedFile,
          user
      );

      showSuccess(
          uploadCategory === 'SIGNATURE'
              ? 'Signature envoyée au backend.'
              : 'Justificatif ajouté avec succès.'
      );

      setSelectedFile(null);

      const input = document.getElementById(
          'dossier-document-file'
      );

      if (input) input.value = '';

      await loadDossier(true);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleReceptionTransmission = async (event) => {
    event.preventDefault();

    if (!canReceptionTransmit || processingAction) return;

    if (!targetDepartment) {
      showError('Veuillez choisir un département destinataire.');
      return;
    }

    try {
      setProcessingAction(true);

      await workflowService.executeTransition(
          dossierId,
          {
            actionId: 'TRANSMIT',
            targetDepartment: Number(targetDepartment),
          },
          user
      );

      showSuccess('Dossier transmis avec succès.');

      setTargetDepartment('');

      // Après transmission, la Réception peut ne plus avoir
      // accès à ce dossier. On retourne à la liste.
      navigate('/dossiers');
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDecision = async (event) => {
    event.preventDefault();

    if (!selectedAction || !dossier || processingAction) {
      return;
    }

    if (isReception || isAdmin) {
      showError(
          'Tu ne disposes pas de l’autorisation pour effectuer cette action.'
      );
      return;
    }

    if (!documentId) {
      showError('Aucun document associé à ce dossier.');
      return;
    }

    if (
        requiresJustification &&
        !justification.trim()
    ) {
      showError(
          'Une justification est obligatoire pour le rejet.'
      );
      return;
    }

    if (
        requiresDestination &&
        !targetDepartment
    ) {
      showError('Veuillez choisir un département destinataire.');
      return;
    }

    const action = ['VALIDATE', 'VALIDER'].includes(selectedAction)
        ? 'VALIDER' : 'REJETER';
    if (action === 'VALIDER' && !decisionSignature) {
      showError('Une signature JPEG est obligatoire pour valider le document.');
      return;
    }
    if (!window.confirm(action === 'VALIDER'
        ? 'Confirmer la validation du document avec cette signature ?'
        : 'Confirmer le rejet du document avec cette justification ?')) return;

    try {
      setProcessingAction(true);
      await dossierService.submitDecision(
          dossierId,
          documentId,
          action,
          {
            justification: justification.trim(),
            destinationDepartementId: targetDepartment ? Number(targetDepartment) : null,
          },
          decisionSignature
      );

      showSuccess(
          action === 'VALIDER'
              ? 'Document validé avec succès.'
              : 'Document rejeté avec succès.'
      );

      setSelectedAction('');
      setTargetDepartment('');
      setJustification('');
      setDecisionSignature(null);

      await loadDossier(true);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePayment = async () => {
    if (paymentProcessing || !dossier?.dossierId) return;
    if (!window.confirm(`Confirmer le paiement de ${formatTND(currentDocument?.montant)} pour la facture ${currentDocument?.numeroFacture || 'sans r\u00e9f\u00e9rence'} ?`)) return;
    setPaymentProcessing(true);
    try {
      await dossierService.payDossier(dossier.dossierId);
      showSuccess('Paiement enregistr\u00e9.');
      await loadDossier(true);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (archiveProcessing || !dossier?.dossierId) return;
    if (!window.confirm('Confirmer l\u2019archivage de ce dossier pay\u00e9 ?')) return;
    setArchiveProcessing(true);
    try {
      await dossierService.archiveDossier(dossier.dossierId);
      showSuccess('Dossier archiv\u00e9.');
      await loadDossier(true);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setArchiveProcessing(false);
    }
  };

  const handleDownload = async (
      document,
      attachment
  ) => {
    const currentDocumentId = getDocumentId(document);
    const pieceJointeId = getAttachmentId(attachment);

    if (!currentDocumentId || !pieceJointeId) {
      showError(
          'Identifiant de la pièce jointe introuvable.'
      );
      return;
    }

    try {
      const response =
          await documentService.downloadAttachment(
              currentDocumentId,
              pieceJointeId
          );

      const blob =
          response?.data instanceof Blob
              ? response.data
              : response instanceof Blob
                  ? response
                  : new Blob([response], {
                    type: 'application/pdf',
                  });

      const url = window.URL.createObjectURL(blob);

      const link = window.document.createElement('a');

      link.href = url;
      link.download = getAttachmentName(attachment);

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError(
          getErrorMessage(error) ||
          'Impossible de télécharger ce document.'
      );
    }
  };

  if (loading) {
    return (
        <div className="flex min-h-[300px] items-center justify-center">
          <RefreshCw className="mr-3 h-5 w-5 animate-spin text-red-600" />

          <span className="text-sm text-gray-600">
                    Chargement du dossier...
                </span>
        </div>
    );
  }

  if (pageError || !dossier) {
    return (
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle size={22} />

              <p className="font-medium">
                {pageError || 'Dossier introuvable.'}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/dossiers')}>
                Retour aux dossiers
              </Button>

              <Button
                  variant="outline"
                  onClick={() => loadDossier()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        </div>
    );
  }

  const dossierReference =
      dossier.nomDossier ||
      dossier.reference ||
      dossier.dossierRef ||
      `Dossier #${dossierId}`;

  const supplier =
      currentDocument?.fournisseur ||
      'Non renseigné';

  const invoiceNumber =
      currentDocument?.numeroFacture ||
      'Non renseigné';

  const invoiceDate =
      currentDocument?.dateFacture;

  const description =
      dossier.description ||
      currentDocument?.objet ||
      'Aucune description';

  const amount = currentDocument?.montant;
  const financeOperator = Number(user?.roleId) === 4
      && getUserDepartmentId(user) === 6
      && Number(currentDepartmentId) === 6;
  const rawDossierStatus = String(dossier?.statut || '').toUpperCase();
  const documentStatus = Number(currentDocument?.statutId);
  const canPay = financeOperator && rawDossierStatus === 'VALIDE' && documentStatus === 23;
  const canArchive = financeOperator && rawDossierStatus === 'PAYE' && documentStatus === 27;

  return (
      <div className="dossier-detail-page">

        {/* En-tête */}
        <div className="detail-page-header">
          <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => navigate('/dossiers')}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                aria-label="Retour aux dossiers"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="detail-breadcrumb">
                Dossiers / Détails
              </p>

              <h1 className="detail-page-title">Fiche détail du dossier</h1>
              <div className="detail-identity">
                <span className="detail-reference">{dossierReference}</span>
                <DossierStatusBadge status={currentDocument?.statutId ?? dossier?.statutId ?? dossier?.statut} />
              </div>
            </div>
          </div>

          <div className="detail-header-actions">
          <button type="button" className="detail-profile-link" onClick={() => navigate('/profil')}>
            <User size={17} /> {user?.name || user?.email || 'Mon profil'}
          </button>
          <button
              type="button"
              onClick={() => loadDossier(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
            />

            Actualiser
          </button>
          </div>
        </div>

        {/* Informations principales */}
        <Card className="detail-section">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Informations du dossier
              </h2>

              <DossierStatusBadge status={currentDocument?.statutId ?? dossier?.statutId ?? dossier?.statut} />
            </div>
          </CardHeader>

          <CardBody>
            <div className="detail-info-grid">

              <InfoItem
                  icon={<FileText size={18} />}
                  label="Référence du dossier"
                  value={dossierReference}
              />

              <InfoItem
                  icon={<FileText size={18} />}
                  label="Numéro de facture"
                  value={invoiceNumber}
              />

              <InfoItem
                  icon={<Building2 size={18} />}
                  label="Fournisseur"
                  value={supplier}
              />

              <InfoItem
                  icon={<Calendar size={18} />}
                  label="Date de facture"
                  value={formatDate(invoiceDate)}
              />

              <InfoItem
                  icon={<Banknote size={18} />}
                  label="Montant"
                  value={formatTND(amount)}
              />

              <InfoItem
                  icon={<Building2 size={18} />}
                  label="Département actuel"
                  value={department}
              />

              <InfoItem
                  icon={<Calendar size={18} />}
                  label="Date de création"
                  value={formatDate(
                      dossier.dateCreation
                  )}
              />

            </div>

            <div className="detail-description">
              <p className="detail-description-label">
                Description
              </p>

              <p className="detail-description-value">
                {description}
              </p>
            </div>
          </CardBody>
        </Card>

        {financeOperator && (canPay || canArchive || rawDossierStatus === 'PAYE' || rawDossierStatus === 'ARCHIVE') && (
            <Card className="detail-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><CreditCard size={20} /></div>
                  <h2 className="text-lg font-semibold text-gray-900">Paiement</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem icon={<CheckCircle size={18} />} label="Statut du dossier" value={getStatusLabel(rawDossierStatus)} />
                  <InfoItem icon={<Banknote size={18} />} label="Montant &agrave; payer" value={formatTND(amount)} />
                  <InfoItem icon={<FileText size={18} />} label="R&eacute;f&eacute;rence facture" value={invoiceNumber} />
                  <InfoItem icon={<Building2 size={18} />} label="Fournisseur" value={supplier} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {canPay && <Button onClick={handlePayment} disabled={paymentProcessing} icon={paymentProcessing ? RefreshCw : CreditCard}>
                    {paymentProcessing ? 'Enregistrement...' : 'Marquer comme pay\u00e9'}
                  </Button>}
                  {canArchive && <Button onClick={handleArchive} disabled={archiveProcessing} icon={archiveProcessing ? RefreshCw : Archive}>
                    {archiveProcessing ? 'Archivage?' : 'Archiver le dossier'}
                  </Button>}
                  {rawDossierStatus === 'PAYE' && !canArchive && <p className="text-sm text-emerald-700">Dossier pay&eacute;.</p>}
                  {rawDossierStatus === 'ARCHIVE' && <p className="text-sm text-gray-600">Dossier archiv&eacute;.</p>}
                </div>
              </CardBody>
            </Card>
        )}

        {/* Documents et pièces jointes accessibles */}
        <Card className="detail-section">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Documents du dossier
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Pièces jointes accessibles dans ton département.
                </p>
              </div>

              <FileText
                  className="text-gray-400"
                  size={22}
              />
            </div>
          </CardHeader>

          <CardBody>
            {documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-5 py-10 text-center">
                  <FileText
                      className="mx-auto mb-3 text-gray-300"
                      size={32}
                  />

                  <p className="text-sm text-gray-500">
                    Aucun document accessible pour ce dossier.
                  </p>
                </div>
            ) : (
                <div className="space-y-5">
                  {documents.map((document, index) => {
                    const attachments =
                        document.attachments || [];

                    return (
                        <div
                            key={
                                getDocumentId(document) ??
                                index
                            }
                            className="rounded-xl border border-gray-100 p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {document.referenceDocument ||
                                    document.objet ||
                                    `Document #${getDocumentId(document)}`}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {document.typeDocument ||
                                    'Document'}
                              </p>
                            </div>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                {getStatusLabel(
                                                    document.statutId
                                                )}
                                            </span>
                          </div>

                          <p className="detail-document-meta">
                            {document.dateCreation || document.dateAjout
                                ? `Ajouté le ${formatDateTime(document.dateCreation || document.dateAjout)} · ` : ''}
                            Statut : {getStatusLabel(document.statutId)}
                          </p>
                          {attachments.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                Aucune pièce jointe PDF accessible.
                              </p>
                          ) : (
                              <div className="space-y-2">
                                {attachments.map(
                                    (attachment, attachmentIndex) => (
                                        <div
                                            key={
                                                getAttachmentId(attachment) ??
                                                attachmentIndex
                                            }
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                                        >
                                          <div className="flex min-w-0 items-center gap-3">
                                            <div className="rounded-lg bg-red-50 p-2 text-red-600">
                                              <FileText size={18} />
                                            </div>

                                            <div className="min-w-0">
                                              <p className="truncate text-sm font-medium text-gray-800">
                                                {getAttachmentName(attachment)}
                                              </p>

                                              <p className="mt-1 text-xs text-gray-500">
                                                {formatDateTime(
                                                    attachment.dateAjout
                                                )}
                                              </p>
                                            </div>
                                          </div>

                                          <button
                                              type="button"
                                              onClick={() =>
                                                  handleDownload(
                                                      document,
                                                      attachment
                                                  )
                                              }
                                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                          >
                                            <Download size={14} />
                                            Télécharger
                                          </button>
                                        </div>
                                    )
                                )}
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
            )}
          </CardBody>
        </Card>

        {/* Ajout de justificatif ou signature */}
        {canUploadDocument && (
            <Card className="detail-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <UploadCloud size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Ajouter un document
                    </h2>
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                <form
                    onSubmit={handleUpload}
                    className="space-y-4"
                >
                  {canUploadPdfJustificatif &&
                      canUploadJpegSignature && (
                          <div>
                            <label
                                htmlFor="upload-category"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                              Type de document
                            </label>

                            <select
                                id="upload-category"
                                value={uploadCategory}
                                onChange={(event) => {
                                  setUploadCategory(
                                      event.target.value
                                  );
                                  setSelectedFile(null);
                                }}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            >
                              <option value="JUSTIFICATIF">
                                Justificatif (PDF)
                              </option>

                              <option value="SIGNATURE">
                                Signature interne (JPEG)
                              </option>
                            </select>
                          </div>
                      )}

                  <div>
                    <label
                        htmlFor="dossier-document-file"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Fichier{' '}
                      {uploadCategory === 'SIGNATURE'
                          ? 'JPEG'
                          : 'PDF'}
                    </label>

                    <input
                        id="dossier-document-file"
                        type="file"
                        accept={
                          uploadCategory === 'SIGNATURE'
                              ? '.jpg,.jpeg,image/jpeg'
                              : '.pdf,application/pdf'
                        }
                        onChange={handleFileChange}
                        className="block w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-red-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-red-700 hover:file:bg-red-100"
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      Taille maximale : 15 Mo.
                    </p>
                  </div>

                  {selectedFile && (
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                              size={18}
                              className="shrink-0 text-red-600"
                          />

                          <span className="truncate text-sm text-gray-700">
                                            {selectedFile.name}
                                        </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);

                              const input =
                                  window.document.getElementById(
                                      'dossier-document-file'
                                  );

                              if (input) input.value = '';
                            }}
                            className="ml-3 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                            aria-label="Retirer le fichier"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                  )}

                  <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading ? (
                          <RefreshCw
                              size={16}
                              className="animate-spin"
                          />
                      ) : (
                          <UploadCloud size={16} />
                      )}

                      {uploading
                          ? 'Téléversement...'
                          : 'Ajouter le document'}
                    </button>
                  </div>
                </form>
              </CardBody>
            </Card>
        )}

        {/* Transmission initiale par la Réception */}
        {canReceptionTransmit && (
            <Card className="detail-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Send size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Transmettre le dossier
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Choisir le département qui prendra en charge le dossier.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                <form
                    onSubmit={handleReceptionTransmission}
                    className="space-y-4"
                >
                  <div>
                    <label
                        htmlFor="reception-destination"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Département destinataire
                    </label>

                    <select
                        id="reception-destination"
                        value={targetDepartment}
                        onChange={(event) =>
                            setTargetDepartment(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">
                        Choisir un département
                      </option>

                      {RECEPTION_DESTINATIONS.map(
                          (departmentItem) => (
                              <option
                                  key={departmentItem.id}
                                  value={departmentItem.id}
                              >
                                {departmentItem.name}
                              </option>
                          )
                      )}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={
                            !targetDepartment ||
                            processingAction
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction ? (
                          <RefreshCw
                              size={16}
                              className="animate-spin"
                          />
                      ) : (
                          <Send size={16} />
                      )}

                      Transmettre le dossier
                    </button>
                  </div>
                </form>
              </CardBody>
            </Card>
        )}

        {/* Décisions métier */}
        {!isReception &&
            !isAdmin &&
            availableActions.length > 0 && (
                <Card className="detail-section">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <Shield size={20} />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Décision sur le document
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Valider ou rejeter selon les habilitations de ton département.
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardBody>
                    <form
                        onSubmit={handleDecision}
                        className="space-y-4"
                    >
                      <div>
                        <label
                            htmlFor="workflow-action"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Décision
                        </label>

                        <select
                            id="workflow-action"
                            value={selectedAction}
                            onChange={(event) => {
                              setSelectedAction(
                                  event.target.value
                              );
                              setJustification('');
                              setTargetDepartment('');
                              setDecisionSignature(null);
                            }}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">
                            Sélectionner une décision
                          </option>

                          {availableActions.map(
                              (action, index) => {
                                const actionId =
                                    getActionId(action);

                                return (
                                    <option
                                        key={actionId || index}
                                        value={actionId}
                                    >
                                      {getActionLabel(action)}
                                    </option>
                                );
                              }
                          )}
                        </select>
                      </div>

                      {['VALIDATE', 'VALIDER'].includes(selectedAction) && (
                          <div className="decision-signature-field">
                            <label htmlFor="decision-signature">Signature obligatoire (JPEG)</label>
                            <input
                                id="decision-signature"
                                type="file"
                                accept=".jpg,.jpeg,image/jpeg"
                                required
                                onChange={(event) => {
                                  const file = event.target.files?.[0] || null;
                                  const valid = file &&
                                      (file.type === 'image/jpeg' || !file.type) &&
                                      /\.(jpe?g)$/i.test(file.name) &&
                                      file.size <= 15 * 1024 * 1024;
                                  if (file && !valid) {
                                    showError('Choisissez une image JPEG valide de 15 Mo maximum.');
                                    event.target.value = '';
                                    setDecisionSignature(null);
                                    return;
                                  }
                                  setDecisionSignature(file);
                                }}
                            />
                            <small>La signature est contrôlée par le serveur et enregistrée avant la décision.</small>
                            {decisionSignature && <span>{decisionSignature.name}</span>}
                          </div>
                      )}

                      {requiresDestination && (
                          <div>
                            <label
                                htmlFor="decision-destination"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                              Département destinataire
                            </label>

                            <select
                                id="decision-destination"
                                value={targetDepartment}
                                onChange={(event) =>
                                    setTargetDepartment(
                                        event.target.value
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            >
                              <option value="">
                                Choisir un département
                              </option>

                              {destinationOptions.map(
                                  (departmentItem) => (
                                      <option
                                          key={departmentItem.id}
                                          value={departmentItem.id}
                                      >
                                        {departmentItem.name}
                                      </option>
                                  )
                              )}
                            </select>
                          </div>
                      )}

                      {requiresJustification && (
                          <div>
                            <label
                                htmlFor="workflow-justification"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                              Justification obligatoire
                            </label>

                            <textarea
                                id="workflow-justification"
                                rows={4}
                                value={justification}
                                onChange={(event) =>
                                    setJustification(
                                        event.target.value
                                    )
                                }
                                required
                                placeholder="Préciser le motif du rejet..."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                      )}

                      <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={
                                !selectedAction ||
                                processingAction ||
                                (['VALIDATE', 'VALIDER'].includes(selectedAction) && !decisionSignature) ||
                                (
                                    requiresJustification &&
                                    !justification.trim()
                                ) ||
                                (
                                    requiresDestination &&
                                    !targetDepartment
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processingAction ? (
                              <RefreshCw
                                  size={16}
                                  className="animate-spin"
                              />
                          ) : (
                              <CheckCircle size={16} />
                          )}

                          Confirmer la décision
                        </button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
            )}

        {/* Historique interne */}
        {!isAdmin && (
            <Card className="detail-section">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Historique du dossier
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Opérations accessibles à ton département.
                    </p>
                  </div>

                  <Clock
                      size={21}
                      className="text-gray-400"
                  />
                </div>
              </CardHeader>

              <CardBody>
                {history.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      Aucun événement accessible dans l'historique.
                    </div>
                ) : (
                    <div className="space-y-5">
                      {history.map((entry, index) => (
                          <div
                              key={entry.id ?? index}
                              className="relative flex gap-4"
                          >
                            <div className="relative flex flex-col items-center">
                              <div className="z-10 rounded-full bg-red-50 p-2 text-red-600">
                                <CheckCircle size={17} />
                              </div>

                              {index < history.length - 1 && (
                                  <div className="absolute top-10 h-full w-px bg-gray-200" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1 pb-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800">
                                  {String(
                                      entry.action ||
                                      'Événement'
                                  ).replaceAll('_', ' ')}
                                </p>

                                <span className="text-xs text-gray-400">
                                                    {formatDateTime(entry.date)}
                                                </span>
                              </div>

                              {entry.user && (
                                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                    <User size={13} />
                                    {entry.user}
                                  </div>
                              )}

                              {(entry.fromDepartment ||
                                  entry.toDepartment) && (
                                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    {entry.fromDepartment && (
                                        <span>
                                                            Départ : {entry.fromDepartment}
                                                        </span>
                                    )}

                                    {entry.toDepartment && (
                                        <span>
                                                            Destination : {entry.toDepartment}
                                                        </span>
                                    )}
                                  </div>
                              )}

                              {entry.details && (
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-gray-600">
                                    {entry.details}
                                  </p>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </CardBody>
            </Card>
        )}

        {/* Informations de restriction */}
        {(isReception || isAdmin) && (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-gray-500"
              />

              <div>
                <p className="text-sm font-medium text-gray-800">
                  {isReception
                      ? 'Accès Réception'
                      : 'Accès Administrateur'}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {isReception
                      ? 'La Réception peut consulter ses dossiers encore affectés à son département et les transmettre vers un département autorisé. Elle ne peut pas consulter l’historique interne ni prendre de décision métier.'
                      : 'L’administrateur gère les comptes, les rôles et les départements. Il ne prend pas de décisions métier sur les dossiers.'}
                </p>
              </div>
            </div>
        )}
      </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="detail-info-item">
      <div className="detail-info-icon">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="detail-info-label">
          {label}
        </p>

        <p className="detail-info-value">
          {value || 'Non renseigné'}
        </p>
      </div>
    </div>
);

export default DossierDetailsPage;
