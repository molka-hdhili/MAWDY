# MAWDY – Gestion Électronique des Dossiers et Factures

MAWDY est une application web de gestion électronique des documents et de suivi du traitement des factures au sein d'une compagnie d'assurance.

Elle permet de centraliser les dossiers, gérer les documents associés et assurer le suivi des workflows entre les différents départements grâce à une interface moderne et sécurisée.

## Fonctionnalités

- Gestion et création des dossiers.
- Centralisation et gestion des factures et pièces justificatives.
- Gestion des utilisateurs et des rôles.
- Workflow de traitement et de transmission des dossiers entre départements.
- Suivi des validations et des paiements.
- Gestion des signatures électroniques sous forme de pièces justificatives.
- Historique et traçabilité des opérations.
- Tableaux de bord adaptés aux différents profils utilisateurs.

## Technologies utilisées

**Frontend**
- React.js
- Vite
- JavaScript
- Axios
- React Router

**Backend**
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA

**Base de données**
- Oracle Database 21c

## Installation et exécution

### Prérequis
- Node.js et npm
- Java 21
- Oracle Database 21c

### Frontend

```bash
npm install
npm run dev
```

Pour générer la version de production :

```bash
npm run build
```

Les fichiers optimisés sont générés dans le dossier `dist/`.

### Backend

Depuis le dossier du backend :

```bash
./mvnw spring-boot:run
```

Sous Windows PowerShell :

```powershell
.\mvnw.cmd spring-boot:run
```

## Architecture

Le projet repose sur une architecture client-serveur séparant le frontend React, le backend Spring Boot et la base de données Oracle.

---

**MAWDY** – Application de gestion électronique des dossiers et factures.