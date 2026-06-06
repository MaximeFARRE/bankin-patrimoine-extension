import { describe, expect, it } from "vitest";
import type { PatrimoineBankinExport } from "../types/patrimoine";
import { validatePatrimoineExport } from "./validateExport";

function buildExport(overrides: Partial<PatrimoineBankinExport> = {}): PatrimoineBankinExport {
  return {
    source: "bankin",
    exportedAt: "2026-06-06T00:00:00.000Z",
    exportVersion: "1.0",
    accounts: [
      {
        source: "bankin",
        sourceAccountId: "account-1",
        accountName: "Compte courant",
        currency: "EUR"
      }
    ],
    categories: [
      {
        source: "bankin",
        sourceCategoryId: "category-1",
        name: "Courses"
      }
    ],
    transactions: [
      {
        source: "bankin",
        sourceTransactionId: "tx-1",
        sourceAccountId: "account-1",
        sourceCategoryId: "category-1",
        date: "2026-06-06",
        amount: -10,
        currency: "EUR",
        labelRaw: "Commerce",
        labelClean: "commerce",
        transactionHash: "hash-1"
      }
    ],
    metadata: {
      transactionCount: 1,
      accountCount: 1,
      categoryCount: 1
    },
    ...overrides
  };
}

describe("validatePatrimoineExport", () => {
  it("accepts a complete export", () => {
    expect(validatePatrimoineExport(buildExport()).valid).toBe(true);
  });

  it("fails when a transaction references an unknown account", () => {
    const result = validatePatrimoineExport(buildExport({
      transactions: [
        {
          ...buildExport().transactions[0],
          sourceAccountId: "missing-account"
        }
      ]
    }));

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe("unknown_account");
  });

  it("warns but stays valid for duplicated hashes", () => {
    const base = buildExport().transactions[0];
    const result = validatePatrimoineExport(buildExport({
      transactions: [
        base,
        {
          ...base,
          sourceTransactionId: "tx-2"
        }
      ]
    }));

    expect(result.valid).toBe(true);
    expect(result.warnings[0]?.code).toBe("duplicate_transaction_hash");
  });
});
