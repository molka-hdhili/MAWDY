
import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

import {
  DEPARTEMENTS,
  WORKFLOW_STATUS_IDS,
  STATUS_CONFIG
} from '../../utils/constants';

export const DossierFilters = ({
                                 filters,
                                 onChange,
                                 onReset
                               }) => {

  // Statuts avec leurs vrais identifiants Oracle
  const statusOptions = [
    {
      value: 'ALL',
      label: 'Tous les statuts'
    },

    ...Object.entries(WORKFLOW_STATUS_IDS).map(
        ([code, id]) => ({
          value: String(id),
          label: STATUS_CONFIG[id]?.label || code
        })
    )
  ];

  // Départements existants dans le référentiel
  const departmentOptions = [
    {
      value: 'ALL',
      label: 'Tous les départements'
    },

    ...DEPARTEMENTS
        .filter((dept) => dept.actif === 1)
        .map((dept) => ({
          value: dept.nom,
          label: dept.nom
        }))
  ];

  return (
      <div className="filter-bar-card">

        <div className="filter-bar-grid">

          {/* Recherche */}
          <div
              className="form-group"
              style={{ marginBottom: 0 }}
          >
            <label className="form-label">
              Recherche
            </label>

            <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
            >
              <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    color: 'var(--color-text-muted)'
                  }}
              />

              <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Réf. dossier, N° facture, fournisseur..."
                  value={filters.search || ''}
                  onChange={(e) =>
                      onChange('search', e.target.value)
                  }
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div
              className="form-group"
              style={{ marginBottom: 0 }}
          >
            <label className="form-label">
              Statut du dossier
            </label>

            <select
                className="form-control"
                value={filters.status || 'ALL'}
                onChange={(e) =>
                    onChange('status', e.target.value)
                }
            >
              {statusOptions.map((option) => (
                  <option
                      key={option.value}
                      value={option.value}
                  >
                    {option.label}
                  </option>
              ))}
            </select>
          </div>

          {/* Filtre département */}
          <div
              className="form-group"
              style={{ marginBottom: 0 }}
          >
            <label className="form-label">
              Département responsable
            </label>

            <select
                className="form-control"
                value={filters.department || 'ALL'}
                onChange={(e) =>
                    onChange('department', e.target.value)
                }
            >
              {departmentOptions.map((option) => (
                  <option
                      key={option.value}
                      value={option.value}
                  >
                    {option.label}
                  </option>
              ))}
            </select>
          </div>

          {/* Filtre date */}
          <div
              className="form-group"
              style={{ marginBottom: 0 }}
          >
            <label className="form-label">
              Date facture
            </label>

            <input
                type="date"
                className="form-control"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                    onChange('dateFrom', e.target.value)
                }
            />
          </div>

          {/* Réinitialisation */}
          <div>
            <button
                type="button"
                className="btn btn-secondary"
                onClick={onReset}
                title="Réinitialiser les filtres"
                style={{
                  width: '100%',
                  height: '38px'
                }}
            >
              <RotateCcw size={15} />
              <span>Effacer</span>
            </button>
          </div>

        </div>
      </div>
  );
};

export default DossierFilters;
