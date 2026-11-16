
import apiClient from './api';

const AUTH_STORAGE_KEY = 'mawdy_auth_header';

// =====================================================
// HTTP BASIC AUTHENTICATION
// =====================================================

const createBasicAuthHeader = (email, password) => {
  const credentials = new TextEncoder().encode(
      `${email}:${password}`
  );

  let binary = '';

  credentials.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `Basic ${window.btoa(binary)}`;
};

// =====================================================
// EXTRACTION DU MESSAGE D'ERREUR
// =====================================================

const getErrorMessage = (error) => {
  const status = error?.response?.status;

  if (status === 401) {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }

  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'accéder à cette ressource.";
  }

  if (!error?.response) {
    return 'Impossible de contacter le serveur MAWDY. Vérifiez que le backend est démarré.';
  }

  return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Une erreur est survenue pendant l’authentification.'
  );
};

// =====================================================
// NORMALISATION DU PROFIL BACKEND
// =====================================================

const normalizeUser = (user) => {
  if (!user) {
    throw new Error('Profil utilisateur introuvable.');
  }

  const fullName = [
    user.prenom,
    user.nom
  ]
      .filter(Boolean)
      .join(' ')
      .trim();

  const initials = fullName
      ? fullName
          .split(/\s+/)
          .map((part) => part.charAt(0))
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'MW';

  return {
    ...user,

    id: user.utilisateurId,
    utilisateurId: user.utilisateurId,

    name: fullName || user.email,
    username: user.email,
    email: user.email,

    role: user.roleName,
    roleName: user.roleName,
    roleId: user.roleId,

    department: user.departementName,
    departementName: user.departementName,
    departementId: user.departementId,

    avatar: initials
  };
};

// =====================================================
// SERVICE AUTHENTIFICATION
// =====================================================

const authService = {

  /**
   * Connexion via Spring Security HTTP Basic.
   */
  async login(email, password) {
    if (!email?.trim() || !password) {
      throw new Error(
          'Veuillez saisir votre email et votre mot de passe.'
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const authHeader = createBasicAuthHeader(
        normalizedEmail,
        password
    );

    try {
      // Stockage temporaire de l'en-tête Basic.
      sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          authHeader
      );

      // Vérification réelle des identifiants par Spring Security.
      const response = await apiClient.get(
          '/utilisateurs/me'
      );

      return normalizeUser(response);

    } catch (error) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);

      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Récupération du profil lors du rechargement de l'application.
   */
  async getCurrentUser() {
    const authHeader = sessionStorage.getItem(
        AUTH_STORAGE_KEY
    );

    if (!authHeader) {
      return null;
    }

    try {
      const response = await apiClient.get(
          '/utilisateurs/me'
      );

      return normalizeUser(response);

    } catch (error) {
      // Une erreur 401 signifie que les identifiants
      // ne sont plus acceptés par le backend.
      if (error?.response?.status === 401) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }

      throw error;
    }
  },

  /**
   * Déconnexion locale.
   * HTTP Basic ne possède pas de endpoint logout
   * dans la configuration actuelle.
   */
  async logout() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * Vérification de la présence des identifiants.
   */
  isAuthenticated() {
    return Boolean(
        sessionStorage.getItem(AUTH_STORAGE_KEY)
    );
  },

  /**
   * Récupération de l'en-tête d'authentification.
   */
  getAuthHeader() {
    return sessionStorage.getItem(AUTH_STORAGE_KEY);
  }
};

export {
  authService,
  normalizeUser,
  AUTH_STORAGE_KEY
};

export default authService;
