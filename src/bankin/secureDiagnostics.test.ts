import { describe, expect, it } from "vitest";
import type { BankinRawExport } from "../types/bankin";
import { buildSecureDiagnosticReport } from "./secureDiagnostics";

describe("buildSecureDiagnosticReport", () => {
  it("reports schemas, type values and relationships without financial values", () => {
    const raw: BankinRawExport = {
      accounts: [{
        id: "private-account-id",
        name: "Private account name",
        type: "securities",
        balance: 12345,
        currency_code: "EUR"
      }],
      categories: [{ id: "category-id", name: "Private category" }],
      transactions: [{
        id: "private-transaction-id",
        account_id: "private-account-id",
        category_id: "missing-category-id",
        description: "Private transaction description",
        amount: -987,
        date: "2026-01-01"
      }]
    };

    const report = buildSecureDiagnosticReport(raw, [{
      resourcePath: "/v2/accounts/:id/investments",
      method: "GET",
      callCount: 1,
      lastObservedAt: "2026-01-01T00:00:00.000Z"
    }]);
    const serialized = JSON.stringify(report);

    expect(report.fetchedResources[0]).toEqual({
      resourcePath: "/v2/accounts",
      itemCount: 1,
      objectKeys: ["balance", "currency_code", "id", "name", "type"],
      typeValues: ["securities"]
    });
    expect(report.relationships).toMatchObject({
      transactionAccountReferences: 1,
      matchedTransactionAccounts: 1,
      unmatchedTransactionAccounts: 0,
      transactionCategoryReferences: 1,
      matchedTransactionCategories: 0,
      unmatchedTransactionCategories: 1,
      classifiedInvestmentAccounts: 1
    });
    expect(serialized).not.toContain("private-account-id");
    expect(serialized).not.toContain("Private account name");
    expect(serialized).not.toContain("Private transaction description");
    expect(serialized).not.toContain("12345");
    expect(serialized).not.toContain("-987");
  });
});
