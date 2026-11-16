import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import dossierService from '../../services/dossierService';

import DossierFilters from '../../components/dossiers/DossierFilters';
import DossierTable from '../../components/dossiers/DossierTable';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';

const INITIAL_FILTERS = {
  search: '',
  status: 'ALL',
  department: 'ALL',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdDate',
  sortDir: 'desc',
  page: 1,
};

const INITIAL_DATA = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export const DossiersListPage = () => {
  const navigate = useNavigate();
  const { user, canCreate } = useAuth();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [dossiersData, setDossiersData] = useState(INITIAL_DATA);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const fetchDossiers = useCallback(async () => {
    setLoading(true);

    try {
      const result = await dossierService.getDossiers(user, filters);
      const normalized = result.map((d) => ({
        ...d,
        reference: d.nomDossier || `Dossier #${d.dossierId}`,
        invoiceNumber: d.document?.numeroFacture || '-',
        supplier: d.document?.fournisseur || '-',
        amount: d.document?.montant ?? 0,
        currentDepartment: d.nomDepartementActuel || d.departementActuel || '-',
        createdDate: d.dateCreation,
        status: d.document?.statutId ?? d.statut ?? d.status,
      }));
      const departmentFilter = filters.department;
      const filtered = normalized.filter((d) => departmentFilter === 'ALL' ||
          !departmentFilter || String(d.currentDepartment).toLowerCase() === String(departmentFilter).toLowerCase());
      const sorted = [...filtered].sort((a, b) => {
        const key = ({ reference: 'reference', invoiceNumber: 'invoiceNumber', supplier: 'supplier', amount: 'amount', createdDate: 'createdDate' })[filters.sortBy] || 'createdDate';
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return filters.sortDir === 'asc' ? cmp : -cmp;
      });
      const limit = 10;
      const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
      const page = Math.min(filters.page, totalPages);
      setDossiersData({ items: sorted.slice((page - 1) * limit, page * limit), total: sorted.length, page, limit, totalPages });
    } catch (error) {
      showError(error.message || 'Impossible de charger les dossiers.');
    } finally {
      setLoading(false);
    }
  }, [filters, showError, user]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
  };

  const handleSort = (field) => {
    setFilters((previous) => ({
      ...previous,
      sortBy: field,
      sortDir:
          previous.sortBy === field && previous.sortDir === 'desc'
              ? 'asc'
              : 'desc',
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((previous) => ({
      ...previous,
      page: newPage,
    }));
  };

  return (
      <div>
        <div className="page-header-row">
          <div>
            <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-text-main)',
                }}
            >
              Répertoire des dossiers
            </h2>

            <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                }}
            >
              Consultez les dossiers auxquels votre département est autorisé
              à accéder.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
                variant="secondary"
                icon={RefreshCw}
                onClick={fetchDossiers}
                disabled={loading}
            >
              Actualiser
            </Button>

            {canCreate && (
                <Button
                    variant="primary"
                    icon={PlusCircle}
                    onClick={() => navigate('/dossiers/nouveau')}
                >
                  Nouveau dossier
                </Button>
            )}
          </div>
        </div>

        <DossierFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
        />

        <DossierTable
            dossiers={dossiersData.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSort={handleSort}
            loading={loading}
        />

        <Pagination
            currentPage={dossiersData.page}
            totalPages={dossiersData.totalPages}
            totalItems={dossiersData.total}
            pageSize={dossiersData.limit}
            onPageChange={handlePageChange}
        />
      </div>
  );
};

export default DossiersListPage;
