import { getBankinHeaders } from "../storage/storage";
import type {
  BankinAccount,
  BankinApiResponse,
  BankinCategory,
  BankinHeaders,
  BankinRawExport,
  BankinTransaction
} from "../types/bankin";
import { BANKIN_ENDPOINTS, buildTransactionsUrl, resolveBankinUrl } from "./endpoints";

const maxPages = 200;

type FetchOptions = {
  since?: string;
  until?: string;
};

export type BankinResourceType = "accounts" | "categories" | "transactions";

export type BankinProgressEvent = {
  resource: BankinResourceType;
  page: number;
  count: number;
  status: "fetching" | "done";
};

export type BankinDiagnostics = {
  hasAuthorization: boolean;
  hasBankinVersion: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  capturedAt?: string;
  lastTestedEndpoint?: string;
  lastStatus?: number;
  lastStatusText?: string;
};

type FetchPaginatedOptions = {
  resource: BankinResourceType;
  onProgress?: (event: BankinProgressEvent) => void;
};

type FetchAllOptions = FetchOptions & {
  onProgress?: (event: BankinProgressEvent) => void;
};

function buildRequestHeaders(headers: BankinHeaders): HeadersInit {
  return {
    Authorization: headers.authorization,
    ...(headers.bankinVersion ? { "Bankin-Version": headers.bankinVersion } : {}),
    ...(headers.clientId ? { "Client-Id": headers.clientId } : {}),
    ...(headers.clientSecret ? { "Client-Secret": headers.clientSecret } : {}),
    Accept: headers.accept ?? "application/json",
    "Content-Type": headers.contentType ?? "application/json"
  };
}

function getFriendlyBankinError(response: Response): string {
  if (response.status === 401) {
    return "Erreur Bankin 401. L'autorisation n'est plus valide.";
  }

  if (response.status === 403) {
    return "Erreur Bankin 403. Acces refuse. Les headers captures sont peut-etre incomplets.";
  }

  return `Bankin API error ${response.status}`;
}

async function requireHeaders(): Promise<BankinHeaders> {
  const headers = await getBankinHeaders();
  if (!headers?.authorization) {
    throw new Error("Aucune session Bankin detectee. Ouvre Bankin dans un onglet, connecte-toi, puis recharge la page.");
  }

  return headers;
}

export async function fetchPaginated<T>(
  initialUrl: string,
  headers: BankinHeaders,
  pageLimit = maxPages,
  options?: FetchPaginatedOptions
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = initialUrl;
  let pageCount = 0;

  while (nextUrl) {
    pageCount += 1;
    options?.onProgress?.({
      resource: options.resource,
      page: pageCount,
      count: results.length,
      status: "fetching"
    });

    if (pageCount > pageLimit) {
      throw new Error(`Pagination Bankin interrompue apres ${pageLimit} pages.`);
    }

    const response = await fetch(resolveBankinUrl(nextUrl), {
      method: "GET",
      headers: buildRequestHeaders(headers)
    });

    if (!response.ok) {
      throw new Error(getFriendlyBankinError(response));
    }

    const data = await response.json() as BankinApiResponse<T>;
    if (Array.isArray(data.resources)) {
      results.push(...data.resources);
    }

    options?.onProgress?.({
      resource: options.resource,
      page: pageCount,
      count: results.length,
      status: "done"
    });

    nextUrl = data.pagination?.next_uri ?? null;
  }

  return results;
}

export async function getBankinDiagnostics(): Promise<BankinDiagnostics> {
  const headers = await getBankinHeaders();

  return {
    hasAuthorization: Boolean(headers?.authorization),
    hasBankinVersion: Boolean(headers?.bankinVersion),
    hasClientId: Boolean(headers?.clientId),
    hasClientSecret: Boolean(headers?.clientSecret),
    capturedAt: headers?.capturedAt
  };
}

export async function testBankinConnection(): Promise<BankinDiagnostics> {
  const headers = await requireHeaders();
  const endpoint = "https://sync.bankin.com/v2/accounts?limit=1";
  const response = await fetch(endpoint, {
    method: "GET",
    headers: buildRequestHeaders(headers)
  });
  const diagnostics = {
    hasAuthorization: Boolean(headers.authorization),
    hasBankinVersion: Boolean(headers.bankinVersion),
    hasClientId: Boolean(headers.clientId),
    hasClientSecret: Boolean(headers.clientSecret),
    capturedAt: headers.capturedAt,
    lastTestedEndpoint: endpoint,
    lastStatus: response.status,
    lastStatusText: response.statusText
  };

  if (!response.ok) {
    throw new Error(getFriendlyBankinError(response));
  }

  return diagnostics;
}

export async function fetchAccounts(): Promise<BankinAccount[]> {
  return fetchPaginated<BankinAccount>(BANKIN_ENDPOINTS.accounts, await requireHeaders(), maxPages, { resource: "accounts" });
}

export async function fetchCategories(): Promise<BankinCategory[]> {
  return fetchPaginated<BankinCategory>(BANKIN_ENDPOINTS.categories, await requireHeaders(), maxPages, { resource: "categories" });
}

export async function fetchTransactions(options: FetchOptions = {}): Promise<BankinTransaction[]> {
  return fetchPaginated<BankinTransaction>(
    buildTransactionsUrl(options),
    await requireHeaders(),
    maxPages,
    { resource: "transactions" }
  );
}

export async function fetchAllBankinData(options: FetchAllOptions = {}): Promise<BankinRawExport> {
  const headers = await requireHeaders();
  const [accounts, categories, transactions] = await Promise.all([
    fetchPaginated<BankinAccount>(BANKIN_ENDPOINTS.accounts, headers, maxPages, {
      resource: "accounts",
      onProgress: options.onProgress
    }),
    fetchPaginated<BankinCategory>(BANKIN_ENDPOINTS.categories, headers, maxPages, {
      resource: "categories",
      onProgress: options.onProgress
    }),
    fetchPaginated<BankinTransaction>(buildTransactionsUrl(options), headers, maxPages, {
      resource: "transactions",
      onProgress: options.onProgress
    })
  ]);

  return {
    accounts,
    categories,
    transactions
  };
}
