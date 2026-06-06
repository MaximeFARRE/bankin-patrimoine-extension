import { describe, expect, it } from "vitest";
import type { PatrimoineBankinExport } from "../types/patrimoine";
import { buildTransactionsCsv } from "./exportCsv";

describe("buildTransactionsCsv", () => {
  it("escapes quotes and line breaks", () => {
    const data: PatrimoineBankinExport = {
      source: "bankin",
      exportedAt: "2026-06-06T00:00:00.000Z",
      exportVersion: "1.0",
      accounts: [],
      categories: [],
      transactions: [
        {
          source: "bankin",
          sourceTransactionId: "tx-1",
          sourceAccountId: "account-1",
          date: "2026-06-06",
          amount: -10,
          currency: "EUR",
          labelRaw: "Achat \"test\"\nligne",
          labelClean: "achat test ligne",
          transactionHash: "hash-1"
        }
      ],
      metadata: {
        transactionCount: 1,
        accountCount: 0,
        categoryCount: 0
      }
    };

    expect(buildTransactionsCsv(data)).toContain("\"Achat \"\"test\"\" ligne\"");
  });
});
