import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowUpDown, ArrowUp, ArrowDown, Building2 } from 'lucide-react';
import DossierStatusBadge from './DossierStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const DossierTable = ({
  dossiers = [],
  sortBy,
  sortDir,
  onSort,
  loading = false,
}) => {
  const navigate = useNavigate();

  const renderSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;
    }
    return sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  if (loading) {
    return (
      <div className="table-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Chargement des dossiers en cours...</p>
      </div>
    );
  }

  if (dossiers.length === 0) {
    return (
      <div className="table-container" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
          Aucun dossier ne correspond à vos critères
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Modifiez vos filtres de recherche ou créez un nouveau dossier si vous en avez les droits.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => onSort('reference')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Réf. Dossier</span>
                {renderSortIcon('reference')}
              </div>
            </th>
            <th className="sortable" onClick={() => onSort('invoiceNumber')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>N° Facture</span>
                {renderSortIcon('invoiceNumber')}
              </div>
            </th>
            <th className="sortable" onClick={() => onSort('supplier')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Fournisseur</span>
                {renderSortIcon('supplier')}
              </div>
            </th>
            <th className="sortable" onClick={() => onSort('amount')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Montant TTC</span>
                {renderSortIcon('amount')}
              </div>
            </th>
            <th>Département Actuel</th>
            <th className="sortable" onClick={() => onSort('createdDate')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Date Création</span>
                {renderSortIcon('createdDate')}
              </div>
            </th>
            <th>Statut Workflow</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => (
            <tr key={dossier.id}>
              <td>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/dossiers/${dossier.id}`)}
                >
                  {dossier.reference}
                </span>
              </td>
              <td>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {dossier.invoiceNumber}
                </span>
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {dossier.supplier}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {dossier.description?.length > 40
                    ? dossier.description.slice(0, 40) + '...'
                    : dossier.description}
                </div>
              </td>
              <td>
                <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                  {formatCurrency(dossier.amount)}
                </span>
              </td>
              <td>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Building2 size={13} style={{ color: 'var(--color-primary)' }} />
                  {dossier.currentDepartment}
                </span>
              </td>
              <td style={{ color: 'var(--color-text-secondary)' }}>
                {formatDate(dossier.createdDate)}
              </td>
              <td>
                <DossierStatusBadge status={dossier.status} />
              </td>
              <td style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/dossiers/${dossier.id}`)}
                  title="Consulter le dossier"
                >
                  <Eye size={14} />
                  <span>Détails</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DossierTable;
