import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dossierService from '../../services/dossierService';
import workflowService from '../../services/workflowService';
import DossierStatusBadge from '../../components/dossiers/DossierStatusBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';

const TransmittedDossiersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const dossiers = await dossierService.getTransmittedByReception(user);
        const enriched = await Promise.all(dossiers.map(async (d) => {
          try {
            const response = await workflowService.getDossierTransmissionHistory(d.dossierId);
            const history = Array.isArray(response?.data ?? response) ? (response?.data ?? response) : [];
            const sorted = [...history].sort((a, b) => new Date(b.dateTransmission) - new Date(a.dateTransmission));
            return { ...d, lastTransmission: sorted[0] || null, history };
          } catch { return { ...d, lastTransmission: null, history: [] }; }
        }));
        if (active) setRows(enriched);
      } catch (e) { if (active) setError(e.message || 'Impossible de charger les dossiers transmis.'); }
    })();
    return () => { active = false; };
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((d) => [d.nomDossier, d.document?.fournisseur, d.document?.numeroFacture,
      d.dateCreation && formatDate(d.dateCreation),
      d.lastTransmission?.dateTransmission && formatDate(d.lastTransmission.dateTransmission)]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [rows, query]);

  return <section>
    <div className="page-header-row"><div><h2>Dossiers transmis</h2><p>Consultation en lecture seule des dossiers créés et transmis par la Réception.</p></div></div>
    <label style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '1rem 0' }}>
      <Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Référence, fournisseur ou date" aria-label="Rechercher" />
    </label>
    {error && <p role="alert">{error}</p>}
    <div className="table-container"><table className="data-table"><thead><tr>
      <th>Référence</th><th>Fournisseur</th><th>Département destinataire actuel</th><th>Date de transmission</th><th>Statut actuel</th><th>Action</th>
    </tr></thead><tbody>
      {filtered.map((d) => <tr key={d.dossierId}>
        <td>{d.nomDossier}</td><td>{d.document?.fournisseur || '—'}</td>
        <td>{d.nomDepartementActuel || d.departementActuel || '—'}</td>
        <td>{d.lastTransmission?.dateTransmission ? formatDateTime(d.lastTransmission.dateTransmission) : '—'}</td>
        <td><DossierStatusBadge status={d.document?.statutId ?? d.statut} /></td>
        <td><button className="btn btn-secondary btn-sm" onClick={() => navigate(`/dossiers/${d.dossierId}`)}>Consulter</button></td>
      </tr>)}
      {!filtered.length && <tr><td colSpan="6">{error ? ' ' : 'Aucun dossier transmis.'}</td></tr>}
    </tbody></table></div>
    <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>Les documents PDF autorisés et l’historique du workflow sont accessibles dans les détails du dossier.</p>
  </section>;
};
export default TransmittedDossiersPage;
