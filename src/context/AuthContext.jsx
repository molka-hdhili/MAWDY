
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';

import authService from '../services/authService';

import {
  isAdmin,
  isReception,
  isFinance,
  canCreateDossier,
  canViewWorkflowTracking,
  canViewAllDossiers,
  isDepartmentResponsible,
  canUploadSignature,
  canUploadJustificatif,
  canProcessPayment,
  getAvailableWorkflowActions
} from '../utils/permissions';

const AuthContext = createContext(null);

// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =================================================
  // INITIALISATION DE LA SESSION
  // =================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Ne pas appeler le backend si aucune
        // authentification n'est enregistrée.
        const authHeader = sessionStorage.getItem(
            'mawdy_auth_header'
        );

        if (!authHeader) {
          if (mounted) {
            setUser(null);
          }
          return;
        }

        const currentUser = await authService.getCurrentUser();

        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error(
            'Erreur lors de la récupération du profil :',
            error
        );

        sessionStorage.removeItem('mawdy_auth_header');

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // =================================================
  // CONNEXION
  // =================================================

  const login = useCallback(async (email, password) => {
    setLoading(true);

    try {
      const loggedUser = await authService.login(
          email,
          password
      );

      if (!loggedUser) {
        throw new Error(
            'Impossible de récupérer le profil utilisateur.'
        );
      }

      setUser(loggedUser);

      return loggedUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // =================================================
  // DÉCONNEXION
  // =================================================

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authService.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  // =================================================
  // INFORMATIONS ET PERMISSIONS
  // =================================================

  const value = useMemo(() => ({
    user,

    loading,

    isAuthenticated: Boolean(user),

    isAdmin: isAdmin(user),
    isReception: isReception(user),
    isFinance: isFinance(user),

    login,
    logout,

    canCreate: canCreateDossier(user),

    canViewWorkflow: canViewWorkflowTracking(user),

    canViewAllDossiers: canViewAllDossiers(user),

    isResponsibleFor: (dossier) =>
        isDepartmentResponsible(user, dossier),

    canSign: (dossier) =>
        canUploadSignature(user, dossier),

    canAddJustificatif: (dossier) =>
        canUploadJustificatif(user, dossier),

    canPay: (dossier) =>
        canProcessPayment(user, dossier),

    getActionsForDossier: (dossier) =>
        getAvailableWorkflowActions(user, dossier)

  }), [user, loading, login, logout]);

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};

// =====================================================
// HOOK AUTH
// =====================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
        'useAuth doit être utilisé au sein d’un AuthProvider.'
    );
  }

  return context;
};

export default AuthContext;
