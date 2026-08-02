import { describe, expect, it } from "vitest";
import type { BankinRawExport } from "../types/bankin";
import { normalizeBankinExport } from "./normalizer";

describe("normalizeBankinExport", () => {
  it("normalizes accounts, nested categories and transactions", async () => {
    const raw: BankinRawExport = {
      accounts: [
        {
          id: 123,
          name: "Compte courant",
          type: "checking",
          currency_code: "EUR",
          bank: { name: "Banque test" }
        }
      ],
      categories: [
        {
          id: 1,
          name: "Vie quotidienne",
          categories: [{ id: 2, name: "Courses" }]
        }
      ],
      transactions: [
        {
          id: 999,
          account: { id: 123, name: "Compte courant" },
          category: { id: 2, name: "Courses" },
          description: "Supermarche",
          amount: -42.1,
          date: "2026-06-06",
          currency_code: "EUR"
        },
        {
          id: 1000,
          account_id: 123,
          category_id: 2,
          description: "Supermarche",
          amount: -42.1,
          date: "2026-06-06",
          currency_code: "EUR"
        }
      ]
    };

    const normalized = await normalizeBankinExport(raw);

    expect(normalized.accounts[0]?.sourceAccountId).toBe("123");
    expect(normalized.accounts[0]).toMatchObject({
      sourceAccountType: "checking",
      accountType: "checking",
      accountKind: "checking",
      accountSubtype: "current",
      balanceKind: "cash",
      isAsset: true,
      isLiability: false
    });
    expect(normalized.categories).toHaveLength(2);
    expect(normalized.transactions[0]).toMatchObject({
      sourceTransactionId: "999",
      sourceAccountId: "123",
      sourceCategoryId: "2",
      accountName: "Compte courant",
      categoryName: "Courses"
    });
    expect(normalized.transactions[0]?.transactionHash).toHaveLength(64);
    expect(normalized.metadata.validation).toEqual({
      repeatedTransactionHashes: { groupCount: 1, affectedLineCount: 2, excessLineCount: 1 },
      duplicatedSourceTransactionIds: { groupCount: 0, affectedLineCount: 0, excessLineCount: 0 }
    });
  });

  it("exports synthetic savings, investment, loan, unknown and foreign-currency accounts", async () => {
    const raw: BankinRawExport = {
      accounts: [
        { id: "livret", name: "Livret A", type: "savings", balance: 100, currency_code: "EUR" },
        { id: "pel", name: "PEL", type: "savings", balance: 200, currency_code: "EUR" },
        { id: "pea-pme", name: "PEA-PME", type: "securities", balance: 300, currency_code: "EUR" },
        { id: "loan", name: "Credit immobilier", type: "loan", balance: -400, currency_code: "EUR" },
        { id: "unknown", name: "Produit maison", type: "other", balance: 500, currency_code: "EUR" },
        { id: "foreign", name: "Poche USD", type: "other", balance: 600, currency_code: "USD" }
      ],
      categories: [],
      transactions: []
    };

    const normalized = await normalizeBankinExport(raw);
    const byId = new Map(normalized.accounts.map((account) => [account.sourceAccountId, account]));

    expect(byId.get("livret")).toMatchObject({ accountKind: "savings", accountSubtype: "livret_a" });
    expect(byId.get("pel")).toMatchObject({ accountKind: "savings", accountSubtype: "pel" });
    expect(byId.get("pea-pme")).toMatchObject({
      accountKind: "investment",
      accountSubtype: "pea_pme",
      balanceKind: "market_value"
    });
    expect(byId.get("loan")).toMatchObject({
      accountKind: "loan",
      accountSubtype: "mortgage",
      balanceKind: "outstanding_debt",
      isLiability: true
    });
    expect(byId.get("unknown")).toMatchObject({ accountKind: "unknown", accountSubtype: "unknown" });
    expect(byId.get("foreign")).toMatchObject({
      accountKind: "unknown",
      accountSubtype: "unknown",
      currency: "USD"
    });
    expect(normalized.loans).toEqual([
      expect.objectContaining({
        sourceLoanId: "loan",
        sourceAccountId: "loan",
        loanType: "mortgage",
        outstandingPrincipal: 400,
        currency: "EUR"
      })
    ]);
    expect(normalized.positions).toEqual([]);
    expect(normalized.exportVersion).toBe("2.0");
    expect(normalized.metadata).toMatchObject({ loanCount: 1, positionCount: 0 });
  });

  it("adds accounts only referenced by transactions", async () => {
    const raw: BankinRawExport = {
      accounts: [],
      categories: [],
      transactions: [
        {
          id: 999,
          account: {
            id: 123,
            name: "Compte archive",
            bank: { name: "Banque test" }
          },
          description: "Transaction historique",
          amount: -12,
          date: "2026-06-06",
          currency_code: "EUR"
        }
      ]
    };

    const normalized = await normalizeBankinExport(raw);

    expect(normalized.accounts).toMatchObject([
      {
        source: "bankin",
        sourceAccountId: "123",
        accountName: "Compte archive",
        bankName: "Banque test",
        accountKind: "unknown",
        accountSubtype: "unknown",
        currency: "EUR"
      }
    ]);
    expect(normalized.metadata.accountCount).toBe(1);
    expect(normalized.transactions[0]?.sourceAccountId).toBe("123");
  });
});
