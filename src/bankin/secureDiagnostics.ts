import type { BankinObservedResource, BankinRawExport } from "../types/bankin";
import { BANKIN_ENDPOINTS } from "./endpoints";
import { classifyBankinAccount } from "./accountClassification";

export type BankinResourceSummary = {
  resourcePath: string;
  itemCount: number;
  objectKeys: string[];
  typeValues: string[];
};

export type SecureBankinDiagnosticReport = {
  observedResources: BankinObservedResource[];
  fetchedResources: BankinResourceSummary[];
  relationships: {
    transactionAccountReferences: number;
    matchedTransactionAccounts: number;
    unmatchedTransactionAccounts: number;
    transactionCategoryReferences: number;
    matchedTransactionCategories: number;
    unmatchedTransactionCategories: number;
    classifiedLoanAccounts: number;
    classifiedInvestmentAccounts: number;
  };
};

function resourcePath(endpoint: string): string {
  return new URL(endpoint).pathname;
}

function summarize(resourcePathValue: string, items: unknown[]): BankinResourceSummary {
  const records = items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  const objectKeys = Array.from(new Set(records.flatMap((item) => Object.keys(item)))).sort();
  const typeValues = Array.from(new Set(records.map((item) => item.type).filter((value): value is string => typeof value === "string"))).sort();
  return { resourcePath: resourcePathValue, itemCount: items.length, objectKeys, typeValues };
}

export function buildSecureDiagnosticReport(
  raw: BankinRawExport,
  observedResources: BankinObservedResource[]
): SecureBankinDiagnosticReport {
  const accountIds = new Set(raw.accounts.map((account) => String(account.id)));
  const categoryIds = new Set(raw.categories.flatMap((category) => [category, ...(category.categories ?? [])]).map((category) => String(category.id)));
  const transactionAccountIds = raw.transactions
    .map((transaction) => transaction.account_id ?? transaction.account?.id)
    .filter((id): id is string | number => id != null)
    .map(String);
  const transactionCategoryIds = raw.transactions
    .map((transaction) => transaction.category_id ?? transaction.category?.id)
    .filter((id): id is string | number => id != null)
    .map(String);
  const classifications = raw.accounts.map(classifyBankinAccount);

  return {
    observedResources,
    fetchedResources: [
      summarize(resourcePath(BANKIN_ENDPOINTS.accounts), raw.accounts),
      summarize(resourcePath(BANKIN_ENDPOINTS.categories), raw.categories),
      summarize(resourcePath(BANKIN_ENDPOINTS.transactions), raw.transactions)
    ],
    relationships: {
      transactionAccountReferences: transactionAccountIds.length,
      matchedTransactionAccounts: transactionAccountIds.filter((id) => accountIds.has(id)).length,
      unmatchedTransactionAccounts: transactionAccountIds.filter((id) => !accountIds.has(id)).length,
      transactionCategoryReferences: transactionCategoryIds.length,
      matchedTransactionCategories: transactionCategoryIds.filter((id) => categoryIds.has(id)).length,
      unmatchedTransactionCategories: transactionCategoryIds.filter((id) => !categoryIds.has(id)).length,
      classifiedLoanAccounts: classifications.filter(({ accountKind }) => accountKind === "loan").length,
      classifiedInvestmentAccounts: classifications.filter(({ accountKind }) => accountKind === "investment").length
    }
  };
}
