export type PatrimoineBankinExport = {
  source: "bankin";
  exportedAt: string;
  exportVersion: "1.0" | "2.0";
  accounts: PatrimoineAccount[];
  loans?: PatrimoineLoan[];
  positions?: PatrimoinePosition[];
  categories: PatrimoineCategory[];
  transactions: PatrimoineTransaction[];
  metadata: {
    transactionCount: number;
    accountCount: number;
    categoryCount: number;
    loanCount?: number;
    positionCount?: number;
    validation?: PatrimoineValidationMetadata;
    fromDate?: string;
    toDate?: string;
  };
};

export type PatrimoineAccountKind = "checking" | "savings" | "investment" | "loan" | "card" | "unknown";

export type PatrimoineAccountSubtype =
  | "current"
  | "livret_a"
  | "livret_jeune"
  | "ldds"
  | "lep"
  | "pel"
  | "cel"
  | "pea"
  | "pea_pme"
  | "cto"
  | "mortgage"
  | "consumer_loan"
  | "student_loan"
  | "unknown";

export type PatrimoineBalanceKind = "cash" | "market_value" | "outstanding_debt" | "unknown";

export type PatrimoineAccount = {
  source: "bankin";
  sourceAccountId: string;
  accountName: string;
  bankName?: string;
  sourceAccountType?: string;
  accountKind?: PatrimoineAccountKind;
  accountSubtype?: PatrimoineAccountSubtype;
  balanceKind?: PatrimoineBalanceKind;
  isAsset?: boolean;
  isLiability?: boolean;
  /** @deprecated Use sourceAccountType. Preserved for v1 consumers. */
  accountType?: string;
  balance?: number;
  currency: string;
};

export type PatrimoineLoan = {
  source: "bankin";
  sourceLoanId: string;
  sourceAccountId: string;
  loanType: PatrimoineAccountSubtype;
  initialPrincipal?: number;
  outstandingPrincipal?: number;
  interestRate?: number;
  startDate?: string;
  endDate?: string;
  durationMonths?: number;
  monthlyPayment?: number;
  insuranceAmount?: number;
  currency: string;
};

export type PatrimoinePosition = {
  source: "bankin";
  sourcePositionId: string;
  sourceAccountId: string;
  assetName?: string;
  isin?: string;
  symbol?: string;
  quantity?: number;
  unitPrice?: number;
  marketValue?: number;
  currency: string;
  valuedAt?: string;
};

export type PatrimoineDuplicateStats = {
  groupCount: number;
  affectedLineCount: number;
  excessLineCount: number;
};

export type PatrimoineValidationMetadata = {
  repeatedTransactionHashes: PatrimoineDuplicateStats;
  duplicatedSourceTransactionIds: PatrimoineDuplicateStats;
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
  sourceAccountType?: string;
  accountKind?: PatrimoineAccountKind;
  accountSubtype?: PatrimoineAccountSubtype;
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
