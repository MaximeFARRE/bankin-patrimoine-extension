const BANKIN_API_BASE = "https://sync.bankin.com";

export const BANKIN_ENDPOINTS = {
  accounts: `${BANKIN_API_BASE}/v2/accounts?limit=500`,
  categories: `${BANKIN_API_BASE}/v2/categories?limit=200`,
  transactions: `${BANKIN_API_BASE}/v2/transactions?limit=500`
};

type TransactionUrlOptions = {
  limit?: number;
  since?: string;
  until?: string;
};

export function buildTransactionsUrl(options: TransactionUrlOptions = {}): string {
  const url = new URL(`${BANKIN_API_BASE}/v2/transactions`);
  url.searchParams.set("limit", String(options.limit ?? 500));

  if (options.since) {
    url.searchParams.set("since", options.since);
  }

  if (options.until) {
    url.searchParams.set("until", options.until);
  }

  return url.toString();
}

export function resolveBankinUrl(value: string): string {
  if (value.startsWith("http")) {
    return value;
  }

  return `${BANKIN_API_BASE}${value}`;
}
