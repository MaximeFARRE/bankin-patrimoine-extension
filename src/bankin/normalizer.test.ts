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
        }
      ]
    };

    const normalized = await normalizeBankinExport(raw);

    expect(normalized.accounts[0]?.sourceAccountId).toBe("123");
    expect(normalized.categories).toHaveLength(2);
    expect(normalized.transactions[0]).toMatchObject({
      sourceTransactionId: "999",
      sourceAccountId: "123",
      sourceCategoryId: "2",
      accountName: "Compte courant",
      categoryName: "Courses"
    });
    expect(normalized.transactions[0]?.transactionHash).toHaveLength(64);
  });
});
