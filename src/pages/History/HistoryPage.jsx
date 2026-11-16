import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, RefreshCw, Eye, Building2 } from 'lucide-react';
import workflowService from '../../services/workflowService';
import Button from '../../components/common/Button';
import { DEPARTMENTS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

export const HistoryPage = () => {
  const navigate = useNavigate();

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    department: 'ALL',
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workflowService.getGlobalHistory(filters);
      setHistoryItems(data);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Journal d'Audit & Historique des Événements
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Traçabilité réglementaire complète : créations, transferts inter-départements, visas hiérarchiques et paiements.
          </p>
        </div>

        <Button variant="secondary" icon={RefreshCw} onClick={fetchHistory}>
          Actualiser
        </Button>
      </div>

      {/* Barre de Filtres */}
      <div className="filter-bar-card">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Recherche</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Réf. dossier, utilisateur, mot-clé, justification..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filtrer par Département</label>
            <select
              className="form-control"
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="ALL">Tous les départements</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={() => setFilters({ search: '', department: 'ALL' })}
              style={{ width: '100%', height: '38px' }}
            >
              Effacer
            </Button>
          </div>
        </div>
      </div>

      {/* Table du Journal d'Audit */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Chargement de l'historique...
          </div>
        ) : historyItems.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <p style={{ fontWeight: 600 }}>Aucun événement trouvé dans l'historique.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Dossier</th>
                <th>Action Réalisée</th>
                <th>Utilisateur & Rôle</th>
                <th>Transition Dépt.</th>
                <th>Motif / Justification</th>
                <th style={{ textAlign: 'right' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((h, idx) => (
                <tr key={h.id || idx}>
                  <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(h.timestamp)}
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/dossiers/${h.dossierId}`)}
                    >
                      {h.dossierRef}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {h.supplier}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        fontWeight: 600,
                        fontSize: '0.775rem',
                      }}
                    >
                      {h.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{h.user}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {h.userRole}
                    </div>
                  </td>
                  <td>
                    {h.fromDepartment && h.toDepartment ? (
                      <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>{h.fromDepartment}</span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>→</span>
                        <strong>{h.toDepartment}</strong>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    {h.comment ? (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {h.comment}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/dossiers/${h.dossierId}`)}
                      title="Ouvrir le dossier"
                    >
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
