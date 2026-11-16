import React from 'react';
import Badge from '../common/Badge';
import { STATUS_CONFIG } from '../../utils/constants';

const STATUS_ID_BY_CODE = Object.fromEntries(
    Object.entries(STATUS_CONFIG).map(([id, config]) => [config.code, id])
);

export const DossierStatusBadge = ({ status, statusId }) => {
  const value = status ?? statusId;
  const key = STATUS_CONFIG[value] ? value : STATUS_ID_BY_CODE[String(value ?? '').toUpperCase()];
  const config = STATUS_CONFIG[key] || {
    label: value === null || value === undefined || value === '' ? 'Statut non renseigné' : `Statut non référencé (${value})`,
    variant: 'neutral',
  };

  return (
    <Badge variant={config.variant} title={config.description}>
      {config.label}
    </Badge>
  );
};

export default DossierStatusBadge;
