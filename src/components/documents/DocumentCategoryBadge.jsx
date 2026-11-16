import React from 'react';
import { DOCUMENT_CATEGORIES } from '../../utils/constants';

export const DocumentCategoryBadge = ({ category }) => {
  const cat = DOCUMENT_CATEGORIES[category] || {
    label: category || 'DOCUMENT',
    key: 'DOCUMENT',
  };

  const badgeClass =
    category === 'FACTURE'
      ? 'badge-doc-facture'
      : category === 'JUSTIFICATIF'
      ? 'badge-doc-justificatif'
      : category === 'SIGNATURE'
      ? 'badge-doc-signature'
      : 'badge-neutral';

  return <span className={`badge ${badgeClass}`}>{cat.label}</span>;
};

export default DocumentCategoryBadge;
