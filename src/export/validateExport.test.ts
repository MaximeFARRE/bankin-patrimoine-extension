import { describe, expect, it } from "vitest";
import type { PatrimoineBankinExport } from "../types/patrimoine";
import { validatePatrimoineExport } from "./validateExport";

function buildExport(overrides: Partial<PatrimoineBankinExport> = {}): PatrimoineBankinExport {
  return {
    source: "bankin",
    exportedAt: "2026-06-06T00:00:00.000Z",
    exportVersion: "2.0",
    loans: [],
    positions: [],
    accounts: [
      {
        source: "bankin",
        sourceAccountId: "account-1",
        accountName: "Compte courant",
        sourceAccountType: "checking",
        accountKind: "checking",
        accountSubtype: "current",
        balanceKind: "cash",
        isAsset: true,
        isLiability: false,
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
      categoryCount: 1,
      loanCount: 0,
      positionCount: 0,
      validation: {
        repeatedTransactionHashes: { groupCount: 0, affectedLineCount: 0, excessLineCount: 0 },
        duplicatedSourceTransactionIds: { groupCount: 0, affectedLineCount: 0, excessLineCount: 0 }
      }
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

  it("fails when a loan references an unknown account", () => {
    const result = validatePatrimoineExport(buildExport({
      loans: [{
        source: "bankin",
        sourceLoanId: "loan-1",
        sourceAccountId: "missing-account",
        loanType: "mortgage",
        outstandingPrincipal: 100,
        currency: "EUR"
      }]
    }));

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe("unknown_portfolio_account");
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
    expect(result.warnings[0]?.message).toContain("1 groupe(s)");
    expect(result.warnings[0]?.message).toContain("2 lignes");
    expect(result.warnings[0]?.message).toContain("1 excedentaire(s)");
  });

  it("blocks genuinely duplicated Bankin transaction identifiers", () => {
    const base = buildExport().transactions[0];
    const result = validatePatrimoineExport(buildExport({
      transactions: [base, { ...base, transactionHash: "hash-2" }]
    }));

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      expect.objectContaining({ code: "duplicate_transaction_id" })
    ]);
  });

  it("blocks authentication fields anywhere in an export", () => {
    const unsafe = buildExport() as PatrimoineBankinExport & { authorization?: string };
    unsafe.authorization = "synthetic-secret";

    const result = validatePatrimoineExport(unsafe);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      expect.objectContaining({ code: "secret_in_export" })
    ]);
  });
});
