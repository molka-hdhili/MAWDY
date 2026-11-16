import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Eye,
  RefreshCw,
} from 'lucide-react';

import documentService from '../../services/documentService';
import DocumentCategoryBadge from '../../components/documents/DocumentCategoryBadge';
import Button from '../../components/common/Button';
import { formatDate, formatFileSize } from '../../utils/formatters';

export const DocumentsPage = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    category: 'ALL',
  });

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await documentService.getAllDocuments(filters);

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      // Les signatures ne doivent jamais être exposées dans la GED.
      const visibleDocuments = result.filter(
        (doc) =>
          String(doc.category || doc.typeDocument || '').toUpperCase() !==
          'SIGNATURE'
      );

      setDocuments(visibleDocuments);
    } catch (err) {
      console.error('Erreur chargement documents :', err);
      setDocuments([]);
      setError(
        err.response?.data?.message ||
        'Impossible de charger les documents.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleFilterCategory = (category) => {
    setFilters((prev) => ({
      ...prev,
      category,
    }));
  };

  const filteredDocuments = documents.filter((doc) => {
    const search = filters.search.trim().toLowerCase();

    const category = String(
      doc.category || doc.typeDocument || ''
    ).toUpperCase();

    const matchesCategory =
      filters.category === 'ALL' ||
      category === filters.category;

    const searchableText = [
      doc.name,
      doc.objet,
      doc.dossierRef,
      doc.referenceDocument,
      doc.supplier,
      doc.fournisseur,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !search || searchableText.includes(search);

    return matchesCategory && matchesSearch;
  });

  const getDocumentName = (doc) =>
    doc.name ||
    doc.objet ||
    doc.referenceDocument ||
    'Document sans nom';

  const getCategory = (doc) =>
    doc.category || doc.typeDocument || 'AUTRE';

  const getDossierId = (doc) =>
    doc.dossierId ?? doc.dossier?.dossierId;

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
            Gestion Électronique des Documents (GED)
          </h2>

          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem',
            }}
          >
            Consultez les documents PDF et les pièces justificatives
            accessibles à votre département.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={fetchDocs}
        >
          Actualiser
        </Button>
      </div>

      <div className="filter-bar-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '360px',
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--color-text-muted)',
              }}
            />

            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Rechercher un document, une référence..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { key: 'ALL', label: 'Tous les documents' },
              { key: 'FACTURE', label: 'Factures' },
              { key: 'JUSTIFICATIF', label: 'Justificatifs' },
            ].map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`btn btn-sm ${
  filters.category === cat.key
      ? 'btn-primary'
      : 'btn-secondary'
}`}
                onClick={() => handleFilterCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            Chargement des documents...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--color-danger, #dc2626)',
            }}
          >
            {error}
            <div style={{ marginTop: '1rem' }}>
              <Button variant="secondary" onClick={fetchDocs}>
                Réessayer
              </Button>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: 'var(--color-text-main)',
              }}
            >
              Aucun document trouvé.
            </p>

            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
              }}
            >
              Aucun document ne correspond à votre recherche
              ou à votre département.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Nom du document</th>
                <th>Dossier lié</th>
                <th>Fournisseur</th>
                <th>Taille</th>
                <th>Ajouté par</th>
                <th>Date d'ajout</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((doc, index) => {
                const dossierId = getDossierId(doc);

                // documentId est le nom utilisé par l'entité backend.
                const documentKey =
                  doc.documentId ??
                  doc.id ??
                  doc.pieceJointeId ??
                  `${dossierId ?? 'document'}-${index}`;

                return (
                  <tr key={documentKey}>
                    <td>
                      <DocumentCategoryBadge
                        category={getCategory(doc)}
                      />
                    </td>

                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <FileText
                          size={16}
                          style={{
                            color: 'var(--color-text-muted)',
                          }}
                        />
                        <span>{getDocumentName(doc)}</span>
                      </div>
                    </td>

                    <td>
                      {dossierId ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            navigate(`/dossiers/${dossierId}`)
                          }
                        >
                          {doc.dossierRef ||
                            doc.referenceDocument ||
                            `Dossier #${dossierId}`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td>
                      {doc.supplier || doc.fournisseur || '—'}
                    </td>

                    <td>
                      {doc.size != null
                        ? formatFileSize(doc.size)
                        : '—'}
                    </td>

                    <td>{doc.uploadedBy || '—'}</td>

                    <td>
                      {doc.uploadedAt
                        ? formatDate(doc.uploadedAt)
                        : '—'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={!dossierId}
                        onClick={() =>
                          navigate(`/dossiers/${dossierId}`)
                        }
                        title="Voir le dossier"
                      >
                        <Eye size={13} />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
