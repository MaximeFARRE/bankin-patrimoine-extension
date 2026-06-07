import type { BankinAccount, BankinCategory, BankinRawExport, BankinTransaction } from "../types/bankin";
import type {
  PatrimoineAccount,
  PatrimoineBankinExport,
  PatrimoineCategory,
  PatrimoineTransaction
} from "../types/patrimoine";
import { getDateRange } from "../utils/dates";
import { buildTransactionHash, normalizeLabel } from "../utils/hash";

function asString(value: number | string | undefined | null): string {
  return value == null ? "" : String(value);
}

function getCurrency(value: { currency_code?: string; currency?: string }): string {
  return value.currency_code ?? value.currency ?? "EUR";
}

function getTransactionAccountId(transaction: BankinTransaction): string {
  return asString(transaction.account_id ?? transaction.account?.id);
}

function getTransactionCategoryId(transaction: BankinTransaction): string | undefined {
  const id = transaction.category_id ?? transaction.category?.id;
  return id == null ? undefined : String(id);
}

function getLabel(transaction: BankinTransaction): string {
  return transaction.description ?? transaction.full_description ?? transaction.wording ?? "";
}

function flattenCategories(categories: BankinCategory[]): BankinCategory[] {
  return categories.flatMap((category) => {
    const children = category.categories?.map((child) => ({
      ...child,
      parent: {
        id: category.id,
        name: category.name
      }
    })) ?? [];

    return [category, ...children];
  });
}

export function normalizeAccount(account: BankinAccount): PatrimoineAccount {
  return {
    source: "bankin",
    sourceAccountId: asString(account.id),
    accountName: account.name ?? "Compte sans nom",
    bankName: account.bank?.name,
    accountType: account.type,
    balance: account.balance,
    currency: getCurrency(account)
  };
}

function normalizeTransactionAccount(transaction: BankinTransaction): PatrimoineAccount | null {
  const sourceAccountId = getTransactionAccountId(transaction);
  if (!sourceAccountId) {
    return null;
  }

  return {
    source: "bankin",
    sourceAccountId,
    accountName: transaction.account?.name ?? `Compte Bankin ${sourceAccountId}`,
    bankName: transaction.account?.bank?.name,
    currency: getCurrency(transaction)
  };
}

export function normalizeCategory(category: BankinCategory): PatrimoineCategory {
  return {
    source: "bankin",
    sourceCategoryId: asString(category.id),
    name: category.name ?? "Categorie sans nom",
    parentSourceCategoryId: category.parent?.id == null ? undefined : String(category.parent.id),
    parentName: category.parent?.name
  };
}

export async function normalizeTransaction(
  transaction: BankinTransaction,
  accountsById: Map<string, BankinAccount>,
  categoriesById: Map<string, BankinCategory>
): Promise<PatrimoineTransaction> {
  const sourceAccountId = getTransactionAccountId(transaction);
  const sourceCategoryId = getTransactionCategoryId(transaction);
  const account = accountsById.get(sourceAccountId);
  const category = sourceCategoryId ? categoriesById.get(sourceCategoryId) : undefined;
  const labelRaw = getLabel(transaction);
  const currency = getCurrency(transaction);

  return {
    source: "bankin",
    sourceTransactionId: asString(transaction.id),
    sourceAccountId,
    sourceCategoryId,
    date: transaction.date,
    valueDate: transaction.rdate,
    amount: transaction.amount,
    currency,
    labelRaw,
    labelClean: normalizeLabel(labelRaw),
    categoryName: category?.name ?? transaction.category?.name,
    bankName: account?.bank?.name ?? transaction.account?.bank?.name,
    accountName: account?.name ?? transaction.account?.name,
    transactionHash: await buildTransactionHash({
      sourceAccountId,
      date: transaction.date,
      amount: transaction.amount,
      currency,
      labelRaw
    })
  };
}

export async function normalizeBankinExport(raw: BankinRawExport): Promise<PatrimoineBankinExport> {
  const categories = flattenCategories(raw.categories);
  const accountsById = new Map(raw.accounts.map((account) => [asString(account.id), account]));
  const categoriesById = new Map(categories.map((category) => [asString(category.id), category]));
  const transactions = await Promise.all(
    raw.transactions.map((transaction) => normalizeTransaction(transaction, accountsById, categoriesById))
  );
  const normalizedAccounts = raw.accounts.map(normalizeAccount);
  const normalizedAccountsById = new Map(
    normalizedAccounts.map((account) => [account.sourceAccountId, account])
  );

  for (const transaction of raw.transactions) {
    const account = normalizeTransactionAccount(transaction);
    if (account && !normalizedAccountsById.has(account.sourceAccountId)) {
      normalizedAccountsById.set(account.sourceAccountId, account);
    }
  }

  const accounts = Array.from(normalizedAccountsById.values());
  const range = getDateRange(transactions.map((transaction) => transaction.date));

  return {
    source: "bankin",
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
    accounts,
    categories: categories.map(normalizeCategory),
    transactions,
    metadata: {
      transactionCount: transactions.length,
      accountCount: accounts.length,
      categoryCount: categories.length,
      ...range
    }
  };
}
