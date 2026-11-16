
import axios from 'axios';

const AUTH_STORAGE_KEY = 'mawdy_auth_header';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 15000,
    headers: {
        Accept: 'application/json'
    }
});

// =====================================================
// INTERCEPTEUR REQUEST
// =====================================================

apiClient.interceptors.request.use(
    (config) => {
        const authHeader = sessionStorage.getItem(
            AUTH_STORAGE_KEY
        );

        if (authHeader) {
            config.headers = config.headers || {};
            config.headers.Authorization = authHeader;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// =====================================================
// INTERCEPTEUR RESPONSE
// =====================================================

apiClient.interceptors.response.use(
    (response) => response.data,

    (error) => {
        const status = error.response?.status;

        const message =
            error.response?.data?.message ||
            error.response?.data?.detail ||
            (typeof error.response?.data === 'string'
                ? error.response.data
                : null) ||
            error.message ||
            'Erreur serveur.';

        // Conserver l'objet Axios original et sa réponse HTTP.
        error.status = status || 0;
        error.userMessage = message;

        // 401 : identifiants invalides ou session Basic refusée.
        if (status === 401) {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);

            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        // 403 : utilisateur authentifié mais non autorisé.
        if (status === 403) {
            window.dispatchEvent(
                new CustomEvent('mawdy:forbidden', {
                    detail: {
                        message:
                            'Vous n’avez pas les droits nécessaires.'
                    }
                })
            );
        }

        return Promise.reject(error);
    }
);

export default apiClient;
