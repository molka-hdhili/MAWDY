
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderPlus,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
  ShieldAlert,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import dossierService from '../../services/dossierService';

import { DEPARTMENTS } from '../../utils/constants';
import {
  generateDossierRef,
  generateInvoiceRef,
} from '../../utils/formatters';
import { validateDossierForm } from '../../utils/validators';

import Button from '../../components/common/Button';
import { Card, CardHeader, CardBody } from '../../components/common/Card';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const DESTINATION_DEPARTMENT_IDS = {
  juridique: 1,
  'services generaux': 2,
  operations: 3,
  remorquage: 4,
};

const normalizeDepartmentName = (name) =>
    String(name || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const getDestinationDepartmentId = (departmentName) => {
  const normalizedName = normalizeDepartmentName(departmentName);

  return DESTINATION_DEPARTMENT_IDS[normalizedName] ?? null;
};

const INITIAL_FORM_DATA = {
  dossierRef: generateDossierRef(),
  invoiceNumber: generateInvoiceRef(),
  supplier: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  amount: '',
  description: '',
  destinationDepartment: 'Services généraux',
};

export const CreateDossierPage = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seul le département Réception peut créer un dossier.
  const isReception =
      Number(user?.departementId ?? user?.departmentId) === 15 ||
      normalizeDepartmentName(
          user?.departementName || user?.department || user?.departement
      ) === 'reception';

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: null,
      }));
    }

    if (errors.general) {
      setErrors((previous) => ({
        ...previous,
        general: null,
      }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrors((previous) => ({
        ...previous,
        file: 'La facture originale doit obligatoirement être au format PDF.',
      }));

      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((previous) => ({
        ...previous,
        file: 'La taille maximale autorisée est de 15 Mo.',
      }));

      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    setErrors((previous) => ({
      ...previous,
      file: null,
    }));

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setErrors((previous) => ({
      ...previous,
      file: null,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!isReception) {
      showError('Seul le département Réception peut créer un dossier.');
      return;
    }

    const destinationDepartmentId = getDestinationDepartmentId(
        formData.destinationDepartment
    );

    if (!destinationDepartmentId) {
      setErrors((previous) => ({
        ...previous,
        destinationDepartment:
            'Veuillez sélectionner un département destinataire valide.',
      }));

      showError('Département destinataire invalide.');
      return;
    }

    const validation = validateDossierForm(formData, selectedFile);

    if (!validation.isValid) {
      setErrors(validation.errors || {});
      showError('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    if (!selectedFile) {
      setErrors((previous) => ({
        ...previous,
        file: 'La facture originale en PDF est obligatoire.',
      }));

      showError('Veuillez joindre la facture originale.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        destinationDepartmentId,
      };

      const created = await dossierService.createDossier(
          payload,
          selectedFile,
          user
      );

      if (!created) {
        throw new Error('Le serveur n’a retourné aucune donnée.');
      }

      const dossierId =
          created.id ??
          created.dossierId ??
          created.dossier?.id ??
          created.dossier?.dossierId;

      const reference =
          created.reference ||
          created.dossierRef ||
          created.dossier?.reference ||
          formData.dossierRef;

      showSuccess(`Dossier ${reference} créé avec succès.`);

      navigate(
          dossierId ? `/dossiers/${dossierId}` : '/dossiers',
          { replace: true }
      );
    } catch (error) {
      console.error('Erreur création dossier :', error);

      const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Une erreur est survenue lors de la création du dossier.';

      setErrors((previous) => ({
        ...previous,
        general: message,
      }));

      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contrôle d'accès
  if (!isReception) {
    return (
        <div
            className="card"
            style={{
              maxWidth: '600px',
              margin: '3rem auto',
              textAlign: 'center',
              padding: '3rem 2rem',
            }}
        >
          <ShieldAlert
              size={48}
              style={{
                color: 'var(--color-danger)',
                margin: '0 auto 1rem',
              }}
          />

          <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-text-main)',
                marginBottom: '0.5rem',
              }}
          >
            Accès restreint
          </h2>

          <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
          >
            Seul le département Réception est habilité à créer un nouveau
            dossier et à enregistrer la facture originale.
          </p>

          <Button
              variant="secondary"
              onClick={() => navigate('/dossiers')}
          >
            Retourner aux dossiers
          </Button>
        </div>
    );
  }

  return (
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/dossiers')}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
          >
            <ArrowLeft size={15} />
            <span>Retourner à la liste</span>
          </button>
        </div>

        <Card>
          <CardHeader
              title="Création d'un nouveau dossier de facture"
              subtitle="Enregistrement initial et rattachement de la facture originale au format PDF."
          />

          <CardBody>
            {errors.general && (
                <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-danger-bg)',
                      border: '1px solid var(--color-danger-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-danger)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1.5rem',
                    }}
                >
                  <AlertCircle size={18} />
                  <span>{errors.general}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Référence et numéro facture */}
              <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem',
                  }}
              >
                <div className="form-group">
                  <label className="form-label required">
                    Référence du dossier
                  </label>

                  <input
                      type="text"
                      name="dossierRef"
                      className={`form-control ${
                          errors.dossierRef ? 'is-invalid' : ''
                      }`}
                      value={formData.dossierRef}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="Ex : DOS-2026-1042"
                  />

                  {errors.dossierRef && (
                      <span className="form-error">{errors.dossierRef}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    Numéro de facture fournisseur
                  </label>

                  <input
                      type="text"
                      name="invoiceNumber"
                      className={`form-control ${
                          errors.invoiceNumber ? 'is-invalid' : ''
                      }`}
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="Ex : FAC-2026-8841"
                  />

                  {errors.invoiceNumber && (
                      <span className="form-error">{errors.invoiceNumber}</span>
                  )}
                </div>
              </div>

              {/* Fournisseur et montant */}
              <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr',
                    gap: '1.25rem',
                  }}
              >
                <div className="form-group">
                  <label className="form-label required">
                    Nom du fournisseur / prestataire
                  </label>

                  <input
                      type="text"
                      name="supplier"
                      className={`form-control ${
                          errors.supplier ? 'is-invalid' : ''
                      }`}
                      value={formData.supplier}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="Nom du fournisseur"
                  />

                  {errors.supplier && (
                      <span className="form-error">{errors.supplier}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    Montant total TTC
                  </label>

                  <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      className={`form-control ${
                          errors.amount ? 'is-invalid' : ''
                      }`}
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="1450.00"
                  />

                  {errors.amount && (
                      <span className="form-error">{errors.amount}</span>
                  )}
                </div>
              </div>

              {/* Date et département */}
              <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem',
                  }}
              >
                <div className="form-group">
                  <label className="form-label required">
                    Date d'émission de la facture
                  </label>

                  <input
                      type="date"
                      name="invoiceDate"
                      className={`form-control ${
                          errors.invoiceDate ? 'is-invalid' : ''
                      }`}
                      value={formData.invoiceDate}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                  />

                  {errors.invoiceDate && (
                      <span className="form-error">{errors.invoiceDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    Département destinataire initial
                  </label>

                  <select
                      name="destinationDepartment"
                      className={`form-control ${
                          errors.destinationDepartment ? 'is-invalid' : ''
                      }`}
                      value={formData.destinationDepartment}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                  >
                    {DEPARTMENTS
                        .filter((department) =>
                            getDestinationDepartmentId(department)
                        )
                        .map((department) => (
                            <option key={department} value={department}>
                              {department}
                            </option>
                        ))}
                  </select>

                  {errors.destinationDepartment && (
                      <span className="form-error">
                    {errors.destinationDepartment}
                  </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label required">
                  Objet / Description de la facture
                </label>

                <textarea
                    name="description"
                    rows={3}
                    className={`form-control ${
                        errors.description ? 'is-invalid' : ''
                    }`}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Décrivez les prestations ou biens facturés..."
                />

                {errors.description && (
                    <span className="form-error">{errors.description}</span>
                )}
              </div>

              {/* Facture originale PDF */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label required">
                  Facture originale numérisée (PDF obligatoire)
                </label>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                />

                {!selectedFile ? (
                    <div
                        className={`file-dropzone ${errors.file ? 'error' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                    >
                      <UploadCloud
                          size={36}
                          style={{ color: 'var(--color-primary)' }}
                      />

                      <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text-main)',
                          }}
                      >
                        Sélectionner la facture originale
                      </div>

                      <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                          }}
                      >
                        PDF uniquement • Taille maximale : 15 Mo
                      </div>
                    </div>
                ) : (
                    <div className="file-selected-box">
                      <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                          }}
                      >
                        <CheckCircle
                            size={20}
                            style={{ color: 'var(--color-emerald)' }}
                        />

                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {selectedFile.name}
                          </div>

                          <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                              }}
                          >
                            {(selectedFile.size / 1024).toFixed(1)} Ko • PDF
                          </div>
                        </div>
                      </div>

                      <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={removeSelectedFile}
                          disabled={isSubmitting}
                          title="Retirer le fichier"
                      >
                        <X size={15} />
                      </button>
                    </div>
                )}

                {errors.file && (
                    <span className="form-error">{errors.file}</span>
                )}
              </div>

              {/* Actions */}
              <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    marginTop: '2rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--color-border)',
                  }}
              >
                <Button
                    variant="secondary"
                    onClick={() => navigate('/dossiers')}
                    disabled={isSubmitting}
                >
                  Annuler
                </Button>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    icon={FolderPlus}
                >
                  Créer et enregistrer le dossier
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
  );
};

export default CreateDossierPage;
