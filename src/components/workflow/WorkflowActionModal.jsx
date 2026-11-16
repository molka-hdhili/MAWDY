import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle, Ban, RotateCcw, CreditCard, Archive } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { DEPARTMENTS } from '../../utils/constants';

export const WorkflowActionModal = ({
  isOpen,
  onClose,
  action,
  dossier,
  onConfirm,
}) => {
  if (!action || !dossier) return null;

  const [comment, setComment] = useState('');
  const [justification, setJustification] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [paymentRef, setPaymentRef] = useState(`VIR-${Date.now().toString().slice(-6)}`);
  const [paymentMethod, setPaymentMethod] = useState('Virement Bancaire SEPA');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getActionIcon = () => {
    switch (action.id) {
      case 'REJECT': return Ban;
      case 'RETURN_CORRECTION': return RotateCcw;
      case 'VALIDATE': return CheckCircle;
      case 'PROCESS_PAYMENT': return CreditCard;
      case 'ARCHIVE': return Archive;
      default: return Send;
    }
  };

  const ActionIcon = getActionIcon();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation des champs obligatoires
    if (action.requiresJustification && (!justification || !justification.trim())) {
      setError('La justification du motif est strictement obligatoire.');
      return;
    }

    if (action.requiresDepartmentSelection && !targetDepartment) {
      setError('Veuillez sélectionner le département destinataire.');
      return;
    }

    if (action.requiresPaymentDetails && !paymentRef.trim()) {
      setError('La référence de transaction bancaire est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        actionId: action.id,
        targetStatus: action.targetStatus,
        targetDepartment: action.requiresDepartmentSelection ? targetDepartment : undefined,
        comment: comment.trim(),
        justification: justification.trim(),
        paymentDetails: action.requiresPaymentDetails
          ? { reference: paymentRef.trim(), method: paymentMethod }
          : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du traitement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={action.label}
      icon={ActionIcon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            variant={action.buttonVariant || 'primary'}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Confirmer l'action
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
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          {action.description}
        </div>

        {/* Sélection du département destinataire (pour transmission) */}
        {action.requiresDepartmentSelection && (
          <div className="form-group">
            <label className="form-label required">Département de destination</label>
            <select
              className="form-control"
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
              required
            >
              <option value="">Sélectionnez le département récepteur...</option>
              {DEPARTMENTS.filter((d) => d !== dossier.currentDepartment).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <span className="form-help">
              Le dossier sera transféré sous la responsabilité opérationnelle de ce service.
            </span>
          </div>
        )}

        {/* Motif / Justification formelle obligatoire (pour rejet ou correction) */}
        {action.requiresJustification && (
          <div className="form-group">
            <label className="form-label required">
              {action.id === 'REJECT' ? 'Motif formel du rejet' : 'Motif du retour pour correction'}
            </label>
            <textarea
              className="form-control is-invalid"
              rows={3}
              placeholder={
                action.id === 'REJECT'
                  ? 'Précisez la non-conformité, facture non visée, doublon...'
                  : 'Précisez les pièces ou justificatifs manquants à fournir...'
              }
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              required
            />
            <span className="form-help" style={{ color: 'var(--color-danger)' }}>
              Ce motif sera tracé de façon permanente dans l'historique d'audit du dossier.
            </span>
          </div>
        )}

        {/* Informations de paiement (pour Direction Financière) */}
        {action.requiresPaymentDetails && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label required">Référence virement bancaire</label>
              <input
                type="text"
                className="form-control"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Mode de règlement</label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Virement Bancaire SEPA">Virement Bancaire SEPA</option>
                <option value="Carte Corporate">Carte Corporate</option>
                <option value="Prélèvement Automatique">Prélèvement Automatique</option>
              </select>
            </div>
          </div>
        )}

        {/* Commentaire général optionnel */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Note ou observation complémentaire</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Remarque interne optionnelle..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default WorkflowActionModal;
