import React from 'react';

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Link,
} from 'react-router-dom';

import {
    AuthProvider,
    useAuth,
} from './context/AuthContext';

import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

// Pages publiques et métier
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DossiersListPage from './pages/Dossiers/DossiersListPage';
import TransmittedDossiersPage from './pages/Dossiers/TransmittedDossiersPage';
import CreateDossierPage from './pages/Dossiers/CreateDossierPage';
import DossierDetailsPage from './pages/Dossiers/DossierDetailsPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import HistoryPage from './pages/History/HistoryPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import ProfilePage from './pages/Profile/ProfilePage';

// Pages Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import AdminDossiersPage from './pages/admin/AdminDossiersPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';

import { isAdmin } from './utils/permissions';

// =====================================================
// PAGE DE CHARGEMENT
// =====================================================

const LoadingPage = () => (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            color: 'var(--color-text-muted)',
        }}
    >
        <div className="loading-spinner" />
        <p>Vérification de votre session...</p>
    </div>
);

// =====================================================
// ROUTE PROTÉGÉE
// =====================================================

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// =====================================================
// REDIRECTION APRÈS CONNEXION
// =====================================================

const HomeRedirect = () => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Navigate
            to={isAdmin(user) ? '/admin' : '/dashboard'}
            replace
        />
    );
};

// =====================================================
// ROUTE PUBLIQUE : LOGIN
// =====================================================

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (isAuthenticated) {
        return <HomeRedirect />;
    }

    return children;
};

// =====================================================
// ROUTE ADMIN UNIQUEMENT
// =====================================================

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin(user)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// =====================================================
// ROUTES DES UTILISATEURS NON ADMIN
// =====================================================

const NonAdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isAdmin(user)) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

// =====================================================
// PAGE 404
// =====================================================

const NotFoundPage = () => (
    <div
        style={{
            textAlign: 'center',
            padding: '5rem 2rem',
        }}
    >
        <h1
            style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                marginBottom: '0.5rem',
            }}
        >
            404
        </h1>

        <h2>Page introuvable</h2>

        <p
            style={{
                color: 'var(--color-text-muted)',
                marginBottom: '1.5rem',
            }}
        >
            La ressource demandée n'existe pas ou a été déplacée.
        </p>

        <Link to="/" className="btn btn-primary">
            Retour à l'accueil
        </Link>
    </div>
);

// =====================================================
// APPLICATION
// =====================================================

export const App = () => {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <Routes>

                        {/* Connexion */}
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />

                        {/* Espace authentifié */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >
                            {/* Accueil selon le rôle */}
                            <Route
                                index
                                element={<HomeRedirect />}
                            />

                            {/* ================================= */}
                            {/* ESPACE UTILISATEURS NON ADMIN      */}
                            {/* ================================= */}

                            <Route
                                path="dashboard"
                                element={
                                    <NonAdminRoute>
                                        <DashboardPage />
                                    </NonAdminRoute>
                                }
                            />

                            <Route
                                path="dossiers"
                                element={
                                    <NonAdminRoute>
                                        <DossiersListPage />
                                    </NonAdminRoute>
                                }
                            />

                            <Route path="dossiers/transmis" element={<NonAdminRoute><TransmittedDossiersPage /></NonAdminRoute>} />

                            <Route
                                path="dossiers/nouveau"
                                element={
                                    <NonAdminRoute>
                                        <CreateDossierPage />
                                    </NonAdminRoute>
                                }
                            />

                            <Route
                                path="dossiers/:id"
                                element={
                                    <NonAdminRoute>
                                        <DossierDetailsPage />
                                    </NonAdminRoute>
                                }
                            />

                            <Route
                                path="documents"
                                element={
                                    <NonAdminRoute>
                                        <DocumentsPage />
                                    </NonAdminRoute>
                                }
                            />

                            <Route
                                path="historique"
                                element={
                                    <NonAdminRoute>
                                        <HistoryPage />
                                    </NonAdminRoute>
                                }
                            />

                            <Route
                                path="notifications"
                                element={
                                    <NonAdminRoute>
                                        <NotificationsPage />
                                    </NonAdminRoute>
                                }
                            />

                            {/* Profil accessible à tous les rôles */}
                            <Route
                                path="profil"
                                element={<ProfilePage />}
                            />

                            {/* ================================= */}
                            {/* ESPACE ADMIN                       */}
                            {/* ================================= */}

                            <Route
                                path="admin"
                                element={
                                    <AdminRoute>
                                        <AdminDashboard />
                                    </AdminRoute>
                                }
                            />

                            {/* Gestion des utilisateurs */}
                            <Route
                                path="admin/utilisateurs"
                                element={
                                    <AdminRoute>
                                        <UsersPage />
                                    </AdminRoute>
                                }
                            />

                            {/* Consultation globale des dossiers */}
                            <Route
                                path="admin/dossiers"
                                element={
                                    <AdminRoute>
                                        <AdminDossiersPage />
                                    </AdminRoute>
                                }
                            />

                            {/* Gestion des départements */}
                            <Route
                                path="admin/departements"
                                element={
                                    <AdminRoute>
                                        <DepartmentsPage />
                                    </AdminRoute>
                                }
                            />

                            {/* URL inconnue dans l'espace authentifié */}
                            <Route
                                path="*"
                                element={<NotFoundPage />}
                            />

                        </Route>

                        {/* Toute autre URL */}
                        <Route
                            path="*"
                            element={<HomeRedirect />}
                        />

                    </Routes>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
};

export default App;
