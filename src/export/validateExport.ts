import type { PatrimoineBankinExport } from "../types/patrimoine";
import { getDuplicateStats } from "./duplicateStats";

export type ExportValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type ExportValidationResult = {
  valid: boolean;
  errors: ExportValidationIssue[];
  warnings: ExportValidationIssue[];
};

const requiredTransactionFields = [
  "sourceTransactionId",
  "sourceAccountId",
  "date",
  "amount",
  "currency",
  "labelRaw",
  "labelClean",
  "transactionHash"
] as const;

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

const forbiddenSecretKeys = new Set([
  "authorization",
  "bankinversion",
  "clientid",
  "clientsecret",
  "importkey",
  "token"
]);

function containsSecretKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSecretKey);

  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    return forbiddenSecretKeys.has(normalizedKey) || containsSecretKey(child);
  });
}

export function validatePatrimoineExport(data: PatrimoineBankinExport): ExportValidationResult {
  const issues: ExportValidationIssue[] = [];
  const accountIds = new Set(data.accounts.map((account) => account.sourceAccountId));
  const categoryIds = new Set(data.categories.map((category) => category.sourceCategoryId));

  if (data.source !== "bankin") {
    issues.push({
      severity: "error",
      code: "invalid_source",
      message: "La source de l'export doit etre bankin."
    });
  }

  if (data.exportVersion !== "2.0") {
    issues.push({
      severity: "error",
      code: "invalid_export_version",
      message: "La version d'export doit etre 2.0."
    });
  }

  if (containsSecretKey(data)) {
    issues.push({
      severity: "error",
      code: "secret_in_export",
      message: "L'export contient un champ reserve aux secrets ou headers Bankin."
    });
  }

  for (const account of data.accounts) {
    if (
      !hasValue(account.sourceAccountId) ||
      !hasValue(account.accountName) ||
      !hasValue(account.sourceAccountType) ||
      !hasValue(account.accountKind) ||
      !hasValue(account.accountSubtype) ||
      !hasValue(account.balanceKind) ||
      !hasValue(account.currency) ||
      typeof account.isAsset !== "boolean" ||
      typeof account.isLiability !== "boolean"
    ) {
      issues.push({
        severity: "error",
        code: "invalid_account",
        message: "Un compte exporte a des champs obligatoires manquants."
      });
      break;
    }
  }

  for (const category of data.categories) {
    if (!hasValue(category.sourceCategoryId) || !hasValue(category.name)) {
      issues.push({
        severity: "error",
        code: "invalid_category",
        message: "Une categorie exportee a des champs obligatoires manquants."
      });
      break;
    }
  }

  for (const transaction of data.transactions) {
    const missingField = requiredTransactionFields.find((field) => !hasValue(transaction[field]));
    if (missingField) {
      issues.push({
        severity: "error",
        code: "invalid_transaction",
        message: `Une transaction exportee a un champ obligatoire manquant : ${missingField}.`
      });
      break;
    }
  }

  const unknownAccounts = data.transactions.filter((transaction) => !accountIds.has(transaction.sourceAccountId)).length;
  if (unknownAccounts > 0) {
    issues.push({
      severity: "error",
      code: "unknown_account",
      message: `${unknownAccounts} transaction(s) referencent un compte absent de l'export.`
    });
  }

  const unknownCategories = data.transactions.filter(
    (transaction) => transaction.sourceCategoryId && !categoryIds.has(transaction.sourceCategoryId)
  ).length;
  if (unknownCategories > 0) {
    issues.push({
      severity: "error",
      code: "unknown_category",
      message: `${unknownCategories} transaction(s) referencent une categorie absente de l'export.`
    });
  }

  const duplicatedTransactionIds = getDuplicateStats(data.transactions.map((transaction) => transaction.sourceTransactionId));
  if (duplicatedTransactionIds.groupCount > 0) {
    issues.push({
      severity: "error",
      code: "duplicate_transaction_id",
      message: `${duplicatedTransactionIds.groupCount} groupe(s) d'identifiants Bankin dupliques couvrent ${duplicatedTransactionIds.affectedLineCount} lignes (${duplicatedTransactionIds.excessLineCount} excedentaire(s)).`
    });
  }

  const duplicatedHashes = getDuplicateStats(data.transactions.map((transaction) => transaction.transactionHash));
  if (duplicatedHashes.groupCount > 0) {
    issues.push({
      severity: "warning",
      code: "duplicate_transaction_hash",
      message: `${duplicatedHashes.groupCount} groupe(s) de hash repetes couvrent ${duplicatedHashes.affectedLineCount} lignes (${duplicatedHashes.excessLineCount} excedentaire(s)). Les transactions aux identifiants Bankin distincts sont conservees.`
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");

  return {
    valid: errors.length === 0,
    errors,
    warnings: issues.filter((issue) => issue.severity === "warning")
  };
}
