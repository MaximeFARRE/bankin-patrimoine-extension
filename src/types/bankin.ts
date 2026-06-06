export type BankinHeaders = {
  authorization: string;
  bankinVersion?: string;
  clientId?: string;
  clientSecret?: string;
  accept?: string;
  contentType?: string;
  capturedAt: string;
};

export type BankinAccount = {
  id: number | string;
  name?: string;
  balance?: number;
  currency_code?: string;
  currency?: string;
  type?: string;
  bank?: {
    id?: number | string;
    name?: string;
  };
};

export type BankinCategory = {
  id: number | string;
  name?: string;
  parent?: {
    id?: number | string;
    name?: string;
  };
  categories?: BankinCategory[];
};

export type BankinTransaction = {
  id: number | string;
  account_id?: number | string;
  account?: {
    id?: number | string;
    name?: string;
    bank?: {
      id?: number | string;
      name?: string;
    };
  };
  category_id?: number | string;
  category?: {
    id?: number | string;
    name?: string;
  };
  description?: string;
  full_description?: string;
  wording?: string;
  amount: number;
  date: string;
  rdate?: string;
  currency_code?: string;
  currency?: string;
};

export type BankinRawExport = {
  accounts: BankinAccount[];
  categories: BankinCategory[];
  transactions: BankinTransaction[];
};

export type BankinApiResponse<T> = {
  resources?: T[];
  pagination?: {
    next_uri?: string | null;
  };
};
