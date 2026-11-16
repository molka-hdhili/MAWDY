
import apiClient from './api';

const userService = {
    // Liste des utilisateurs
    async getAll() {
        return await apiClient.get('/utilisateurs');
    },

    // Détail d'un utilisateur
    async getById(id) {
        return await apiClient.get(`/utilisateurs/${id}`);
    },

    // Création
    async create(data) {
        return await apiClient.post('/utilisateurs', {
            nom: data.nom.trim(),
            prenom: data.prenom.trim(),
            email: data.email.trim().toLowerCase(),
            motDePasse: data.motDePasse,
            roleId: Number(data.roleId),
            departementId: Number(data.departementId)
        });
    },

    // Modification
    async update(id, data) {
        return await apiClient.put(`/utilisateurs/${id}`, {
            nom: data.nom.trim(),
            prenom: data.prenom.trim(),
            email: data.email.trim().toLowerCase(),
            roleId: Number(data.roleId),
            departementId: Number(data.departementId)
        });
    },

    // Désactivation
    async deactivate(id) {
        return await apiClient.patch(
            `/utilisateurs/${id}/desactiver`
        );
    },

    // Modification du mot de passe
    async changePassword(id, nouveauMotDePasse) {
        return await apiClient.patch(
            `/utilisateurs/${id}/mot-de-passe`,
            { nouveauMotDePasse }
        );
    }
};

export default userService;
