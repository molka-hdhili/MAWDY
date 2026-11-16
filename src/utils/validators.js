/**
 * MAWDY - Validateurs de Formulaires et Contrôles de Cohérence
 */

import { DEPARTMENTS, DOCUMENT_CATEGORIES } from './constants';

export const validateDossierForm = (formData, file) => {
  const errors = {};

  if (!formData.dossierRef || !formData.dossierRef.trim()) {
    errors.dossierRef = 'La référence du dossier est obligatoire.';
  } else if (!/^DOS-\d{4}-\d+$/i.test(formData.dossierRef.trim())) {
    errors.dossierRef = 'Format attendu : DOS-AAAA-XXXX (ex: DOS-2026-1042).';
  }

  if (!formData.invoiceNumber || !formData.invoiceNumber.trim()) {
    errors.invoiceNumber = 'Le numéro de facture est obligatoire.';
  }

  if (!formData.supplier || !formData.supplier.trim()) {
    errors.supplier = 'Le nom du fournisseur est obligatoire.';
  }

  if (!formData.invoiceDate) {
    errors.invoiceDate = 'La date de facture est obligatoire.';
  } else {
    const invDate = new Date(formData.invoiceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (invDate > today) {
      errors.invoiceDate = 'La date de facture ne peut pas être future.';
    }
  }

  if (formData.amount === undefined || formData.amount === null || formData.amount === '') {
    errors.amount = 'Le montant TTC est obligatoire.';
  } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
    errors.amount = 'Le montant doit être un nombre strictement positif.';
  }

  if (!formData.description || !formData.description.trim()) {
    errors.description = 'L\'objet ou la description de la facture est obligatoire.';
  } else if (formData.description.trim().length < 5) {
    errors.description = 'La description doit comporter au moins 5 caractères.';
  }

  if (!formData.destinationDepartment) {
    errors.destinationDepartment = 'Le département destinataire est obligatoire.';
  } else if (!DEPARTMENTS.includes(formData.destinationDepartment)) {
    errors.destinationDepartment = 'Département invalide sélectionné.';
  }

  // Règle 2 : Chaque dossier a exactement UNE facture PDF à la création
  if (!file) {
    errors.file = 'Le fichier PDF de la facture originale est strictement obligatoire.';
  } else {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      errors.file = 'La facture doit impérativement être un fichier au format PDF.';
    } else if (file.size > 10 * 1024 * 1024) {
      errors.file = 'La taille maximale autorisée pour la facture est de 10 Mo.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateDocumentUpload = (file, categoryKey) => {
  if (!file) {
    return { isValid: false, error: 'Veuillez sélectionner un fichier.' };
  }

  const category = DOCUMENT_CATEGORIES[categoryKey];
  if (!category) {
    return { isValid: false, error: 'Catégorie de document non reconnue.' };
  }

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!category.allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Format incorrect. Extensions autorisées pour ${category.label} : ${category.allowedExtensions.join(', ')}.`,
    };
  }

  if (file.size > category.maxSizeMB * 1024 * 1024) {
    return {
      isValid: false,
      error: `Fichier trop volumineux. La limite est de ${category.maxSizeMB} Mo.`,
    };
  }

  return { isValid: true, error: null };
};
