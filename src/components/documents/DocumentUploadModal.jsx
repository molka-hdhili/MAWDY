import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { DOCUMENT_CATEGORIES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { canUploadJustificatif, canUploadSignature } from '../../utils/permissions';
import { validateDocumentUpload } from '../../utils/validators';

export const DocumentUploadModal = ({
  isOpen,
  onClose,
  dossier,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [category, setCategory] = useState('JUSTIFICATIF');
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Déterminer les catégories autorisées pour l'utilisateur sur ce dossier
  const canJustif = canUploadJustificatif(user);
  const canSign = canUploadSignature(user, dossier);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateDocumentUpload(file, category);
      if (!validation.isValid) {
        setError(validation.error);
        setSelectedFile(null);
      } else {
        setError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier valide.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUploadSuccess(category, selectedFile, comment);
      onClose();
      setSelectedFile(null);
      setComment('');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi du fichier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rattacher un document au dossier"
      icon={UploadCloud}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedFile}
          >
            Téléverser le document
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
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
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Sélection de la catégorie */}
        <div className="form-group">
          <label className="form-label required">Catégorie de document</label>
          <select
            className="form-control"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSelectedFile(null);
              setError(null);
            }}
          >
            {canJustif && (
              <option value="JUSTIFICATIF">
                Pièce Justificative (PDF - Services Généraux)
              </option>
            )}
            {canSign && (
              <option value="SIGNATURE">
                Signature Documentaire (JPEG - Service Responsable)
              </option>
            )}
            {!canJustif && !canSign && (
              <option value="" disabled>
                Aucune catégorie autorisée pour votre profil
              </option>
            )}
          </select>
          <span className="form-help">
            {category === 'SIGNATURE'
              ? 'Format requis : Image JPEG uniquement (max 5 Mo).'
              : 'Format requis : Document PDF uniquement (max 10 Mo).'}
          </span>
        </div>

        {/* Zone de sélection de fichier */}
        <div className="form-group">
          <label className="form-label required">Fichier à téléverser</label>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept={DOCUMENT_CATEGORIES[category]?.acceptMimeTypes}
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div
              className={`file-dropzone ${error ? 'error' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={32} style={{ color: 'var(--color-text-muted)' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                Cliquez pour choisir un fichier sur votre ordinateur
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {DOCUMENT_CATEGORIES[category]?.label} ({DOCUMENT_CATEGORIES[category]?.allowedExtensions.join(', ')})
              </div>
            </div>
          ) : (
            <div className="file-selected-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--color-emerald)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} Ko
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedFile(null)}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Commentaire optionnel */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Commentaire ou observation</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Ex : Document visé après vérification du bon de commande..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUploadModal;
