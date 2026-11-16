
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const LoginPage = () => {
  const navigate = useNavigate();

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ===================================================
  // CONNEXION
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(
          'Veuillez renseigner votre adresse e-mail et votre mot de passe.'
      );
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login(email, password);

      showSuccess(`Bienvenue, ${loggedUser.name} !`);

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
          err.message || 'Adresse e-mail ou mot de passe incorrect.';

      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (
      <div className="login-page">
        <div className="login-card">

          {/* En-tête MAWDY */}
          <div className="login-header">
            <div className="login-logo-badge">M</div>

            <h1 className="login-title">
              MAWDY Enterprise
            </h1>

            <p className="login-subtitle">
              Système de Gestion Électronique des Dossiers & Factures
            </p>
          </div>

          {/* Formulaire */}
          <div className="login-body">

            {error && (
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
                      marginBottom: '1.25rem',
                    }}
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div className="form-group">
                <label className="form-label required">
                  Adresse e-mail professionnelle
                </label>

                <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                >
                  <Mail
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        color: 'var(--color-text-muted)',
                      }}
                  />

                  <input
                      type="email"
                      className="form-control"
                      style={{ paddingLeft: '2.25rem' }}
                      placeholder="nom@mawdy.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      autoComplete="username"
                      required
                      disabled={loading}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div
                  className="form-group"
                  style={{ marginBottom: '1.5rem' }}
              >
                <label className="form-label required">
                  Mot de passe
                </label>

                <div className="password-input-wrapper">
                  <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        color: 'var(--color-text-muted)',
                      }}
                  />

                  <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{
                        paddingLeft: '2.25rem',
                        paddingRight: '2.5rem',
                      }}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                  />

                  <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? 'Masquer' : 'Afficher'
                      }
                      disabled={loading}
                  >
                    {showPassword
                        ? <EyeOff size={16} />
                        : <Eye size={16} />
                    }
                  </button>
                </div>
              </div>

              {/* Bouton de connexion */}
              <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  style={{ width: '100%' }}
                  icon={ArrowRight}
                  iconPosition="right"
              >
                Se connecter au portail
              </Button>

            </form>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;
