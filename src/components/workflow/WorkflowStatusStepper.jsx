import React from 'react';
import { Check, Clock, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { WORKFLOW_STATUS } from '../../utils/constants';

const STEPS_ORDER = [
  { key: WORKFLOW_STATUS.RECU, label: '1. Reçu' },
  { key: WORKFLOW_STATUS.EN_COURS, label: '2. En cours' },
  { key: WORKFLOW_STATUS.EN_ATTENTE_VALIDATION, label: '3. En validation' },
  { key: WORKFLOW_STATUS.VALIDE, label: '4. Validé' },
  { key: WORKFLOW_STATUS.TRANSMIS_FINANCE, label: '5. Finance' },
  { key: WORKFLOW_STATUS.PAYE, label: '6. Payé' },
];

export const WorkflowStatusStepper = ({ currentStatus }) => {
  const isRejected = currentStatus === WORKFLOW_STATUS.REJETE;
  const isCorrection = currentStatus === WORKFLOW_STATUS.RETOUR_CORRECTION;
  const isArchived = currentStatus === WORKFLOW_STATUS.ARCHIVE;

  const currentStepIndex = STEPS_ORDER.findIndex((s) => s.key === currentStatus);

  return (
    <div style={{ margin: '1.5rem 0 2rem' }}>
      {/* Alertes d'états d'exception */}
      {isRejected && (
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
            fontWeight: 600,
          }}
        >
          <XCircle size={18} />
          <span>Ce dossier a été formellement REJETÉ par le responsable.</span>
        </div>
      )}

      {isCorrection && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: 'var(--radius-sm)',
            color: '#EA580C',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={18} />
          <span>Ce dossier a été retourné pour pièces justificatives complémentaires.</span>
        </div>
      )}

      {isArchived && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--color-emerald)' }} />
          <span>Dossier clôturé et archivé numériquement.</span>
        </div>
      )}

      {/* Barre de progression principale */}
      <div className="workflow-stepper">
        {STEPS_ORDER.map((step, idx) => {
          let state = 'upcoming'; // 'completed' | 'current' | 'upcoming'
          if (isArchived || currentStepIndex > idx) {
            state = 'completed';
          } else if (currentStepIndex === idx) {
            state = 'current';
          }

          return (
            <div
              key={step.key}
              className={`step-item ${state}`}
            >
              <div className="step-circle">
                {state === 'completed' ? (
                  <Check size={16} />
                ) : state === 'current' ? (
                  <Clock size={16} />
                ) : (
                  idx + 1
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStatusStepper;
