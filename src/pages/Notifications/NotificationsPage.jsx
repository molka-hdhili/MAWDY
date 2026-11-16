import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { formatDateTime } from '../../utils/formatters';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess } = useToast();

  const [notifications, setNotifications] = useState([]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showSuccess('Toutes les notifications ont été marquées comme lues.');
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Centre de Notifications
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Alertes opérationnelles, rappels de validation et mouvements de dossiers.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={CheckCheck}
          onClick={handleMarkAllRead}
        >
          Tout marquer comme lu
        </Button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune notification disponible.</p>}
            {notifications.map((notif, index) => (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  borderBottom:
                    index < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                  backgroundColor: notif.read ? 'var(--color-surface)' : 'var(--color-primary-light)',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: notif.read ? 'var(--color-bg-secondary)' : '#FEE2E2',
                      color: notif.read ? 'var(--color-text-muted)' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={18} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#FFF',
                            backgroundColor: 'var(--color-primary)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-pill)',
                          }}
                        >
                          NOUVEAU
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(notif.timestamp)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {notif.dossierId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => navigate(`/dossiers/${notif.dossierId}`)}
                    >
                      Dossier
                    </Button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleToggleRead(notif.id)}
                    title={notif.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                  >
                    {notif.read ? 'Non lu' : 'Lu'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default NotificationsPage;
