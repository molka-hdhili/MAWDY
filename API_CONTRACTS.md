# Spécification des Contrats d'API REST – Backend Spring Boot & Oracle XE

Ce document définit les spécifications et contrats d'interfaces REST attendus par le frontend **MAWDY** pour son intégration avec le backend Spring Boot (Java 21, Spring Security, Spring Data JPA, Oracle XE).

---

## 1. Configuration Générale & Authentification

- **URL de Base** : `http://localhost:8080/api`
- **Format d'échange** : JSON (`application/json`) et Multipart (`multipart/form-data`) pour les fichiers
- **Sécurité** : JWT Bearer Token transmis via le header HTTP `Authorization: Bearer <TOKEN>`

### Réponse Standardisée de l'API
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie",
  "timestamp": "2026-11-09T10:00:00Z"
}
```

---

## 2. Endpoints d'Authentification (`/api/auth`)

### `POST /api/auth/login`
Authentification utilisateur et délivrance du JWT.
- **Accès** : Public
- **Corps de Requête (Request Body)** :
```json
{
  "email": "reception@mawdy.com",
  "password": "password123"
}
```
- **Réponse (200 OK)** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "USR-002",
    "name": "Sophie Martin",
    "email": "reception@mawdy.com",
    "role": "EMPLOYE",
    "department": "Réception"
  }
}
```

### `POST /api/auth/logout`
Invalidation de la session active côté serveur.

---

## 3. Endpoints Dossiers & Factures (`/api/dossiers`)

### `GET /api/dossiers`
Recherche, filtrage multicritère, tri et pagination des dossiers.
- **Accès** : Authentifié (tout rôle)
- **Paramètres de Requête (Query Params)** :
  * `search` (optionnel) : recherche textuelle (référence, fournisseur, n° facture)
  * `status` (optionnel) : statut du workflow (`RECU`, `EN_COURS`, `EN_ATTENTE_VALIDATION`, `VALIDE`, `REJETE`, `RETOUR_CORRECTION`, `TRANSMIS_FINANCE`, `PAYE`, `ARCHIVE`)
  * `department` (optionnel) : filtrer par département actuellement responsable
  * `dateFrom`, `dateTo` (optionnel) : intervalle de dates d'émission
  * `sortBy` (défaut : `createdDate`), `sortDir` (`asc` / `desc`)
  * `page` (défaut : 1), `limit` (défaut : 10)
- **Réponse (200 OK)** :
```json
{
  "items": [
    {
      "id": "DOS-2026-0101",
      "reference": "DOS-2026-0101",
      "invoiceNumber": "FAC-2026-4401",
      "supplier": "Assistance Dépannage 24/7",
      "invoiceDate": "2026-10-28",
      "amount": 1450.00,
      "description": "Prestations de remorquage",
      "currentDepartment": "Remorquage",
      "originDepartment": "Réception",
      "createdBy": "Sophie Martin",
      "createdDate": "2026-10-29T08:30:00Z",
      "updatedDate": "2026-10-29T10:15:00Z",
      "status": "RECU"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### `GET /api/dossiers/{id}`
Consultation détaillée d'un dossier avec sa facture unique, ses pièces jointes et son historique.
- **Accès** : Authentifié

### `POST /api/dossiers` (Multipart Form-Data)
Création d'un nouveau dossier et rattachement de la facture originale (PDF).
- **Accès** : `@PreAuthorize("hasRole('ADMIN') or hasAuthority('DEPT_RECEPTION')")`
- **Parties du Formulaire** :
  * `dossierRef` : `DOS-2026-1042`
  * `invoiceNumber` : `FAC-2026-8812`
  * `supplier` : `TotalEnergies Fleet`
  * `invoiceDate` : `2026-10-29`
  * `amount` : `1450.00`
  * `description` : `Description de la prestation`
  * `destinationDepartment` : `Services généraux`
  * `invoiceFile` : Fichier binaire PDF obligatoire (Max 10 Mo)

---

## 4. Endpoints Documents (`/api/documents` et `/api/dossiers/{id}/documents`)

### `GET /api/documents`
Liste globale des documents avec filtrage par catégorie (`FACTURE`, `JUSTIFICATIF`, `SIGNATURE`).

### `POST /api/dossiers/{id}/documents` (Multipart Form-Data)
Ajout d'une pièce justificative ou d'une signature.
- **Règles de validation serveur** :
  * `JUSTIFICATIF` : Format PDF, accessible uniquement au département `Services généraux` ou `ADMIN`.
  * `SIGNATURE` : Format JPEG, accessible uniquement au département actuellement responsable du dossier (interdit à la `Réception`).

---

## 5. Endpoints Moteur de Workflow (`/api/dossiers/{id}/workflow`)

### `POST /api/dossiers/{id}/workflow/transition`
Exécution d'une transition d'état et enregistrement dans l'historique d'audit Oracle.
- **Corps de Requête** :
```json
{
  "action": "VALIDATE", // TAKE_OVER, TRANSMIT, SUBMIT_FOR_VALIDATION, VALIDATE, TRANSMIT_FINANCE, REJECT, RETURN_CORRECTION, PROCESS_PAYMENT, ARCHIVE
  "targetStatus": "VALIDE",
  "targetDepartment": "Services généraux", // Requis si TRANSMIT
  "comment": "Validation technique accordée.",
  "justification": "Non-conformité du montant..." // STRICTEMENT OBLIGATOIRE si REJECT ou RETURN_CORRECTION
}
```

---

## 6. Endpoints Tableau de Bord (`/api/dashboard/stats`)

### `GET /api/dashboard/stats`
Agrégations chiffrées (total, reçus, en cours, attente validation, validés, payés, rejetés), répartition par département et historique récent.
