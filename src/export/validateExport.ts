import type { PatrimoineBankinExport } from "../types/patrimoine";

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

function countDuplicates(values: string[]): number {
  return Array.from(
    values.reduce((counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1), new Map<string, number>())
  ).filter(([, count]) => count > 1).length;
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

  if (data.exportVersion !== "1.0") {
    issues.push({
      severity: "error",
      code: "invalid_export_version",
      message: "La version d'export doit etre 1.0."
    });
  }

  for (const account of data.accounts) {
    if (!hasValue(account.sourceAccountId) || !hasValue(account.accountName) || !hasValue(account.currency)) {
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

  const duplicatedTransactionIds = countDuplicates(data.transactions.map((transaction) => transaction.sourceTransactionId));
  if (duplicatedTransactionIds > 0) {
    issues.push({
      severity: "error",
      code: "duplicate_transaction_id",
      message: `${duplicatedTransactionIds} identifiant(s) Bankin de transaction sont dupliques.`
    });
  }

  const duplicatedHashes = countDuplicates(data.transactions.map((transaction) => transaction.transactionHash));
  if (duplicatedHashes > 0) {
    issues.push({
      severity: "warning",
      code: "duplicate_transaction_hash",
      message: `${duplicatedHashes} hash(s) anti-doublon sont partages par plusieurs transactions.`
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");

  return {
    valid: errors.length === 0,
    errors,
    warnings: issues.filter((issue) => issue.severity === "warning")
  };
}
