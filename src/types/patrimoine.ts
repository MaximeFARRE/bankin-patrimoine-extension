export type PatrimoineBankinExport = {
  source: "bankin";
  exportedAt: string;
  exportVersion: "1.0";
  accounts: PatrimoineAccount[];
  categories: PatrimoineCategory[];
  transactions: PatrimoineTransaction[];
  metadata: {
    transactionCount: number;
    accountCount: number;
    categoryCount: number;
    fromDate?: string;
    toDate?: string;
  };
};

export type PatrimoineAccount = {
  source: "bankin";
  sourceAccountId: string;
  accountName: string;
  bankName?: string;
  accountType?: string;
  balance?: number;
  currency: string;
};

export type PatrimoineCategory = {
  source: "bankin";
  sourceCategoryId: string;
  name: string;
  parentSourceCategoryId?: string;
  parentName?: string;
};

export type PatrimoineTransaction = {
  source: "bankin";
  sourceTransactionId: string;
  sourceAccountId: string;
  sourceCategoryId?: string;
  date: string;
  valueDate?: string;
  amount: number;
  currency: string;
  labelRaw: string;
  labelClean: string;
  categoryName?: string;
  bankName?: string;
  accountName?: string;
  transactionHash: string;
};

export type ExtensionSettings = {
  appImportUrl?: string;
  importKey?: string;
  defaultStartDate?: string;
  includeAccountsWithoutTransactions?: boolean;
  showCsvExport?: boolean;
  debugMode?: boolean;
};

export type ImportResult = {
  success: boolean;
  accountsImported: number;
  accountsUpdated: number;
  transactionsImported: number;
  duplicatesIgnored: number;
  errors?: string[];
};
