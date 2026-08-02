import { describe, expect, it } from "vitest";
import { sanitizeBankinResourcePath } from "./storage";

describe("sanitizeBankinResourcePath", () => {
  it("keeps only the resource path and redacts identifiers", () => {
    expect(sanitizeBankinResourcePath(
      "https://sync.bankin.com/v2/accounts/123456/positions?token=synthetic-secret&name=private"
    )).toBe("/v2/accounts/:id/positions");
    expect(sanitizeBankinResourcePath(
      "https://sync.bankin.com/v3/accounts/01234567-abcd-abcd-abcd-0123456789ab/loans"
    )).toBe("/v3/accounts/:id/loans");
  });

  it("rejects resources outside the supported Bankin origin", () => {
    expect(sanitizeBankinResourcePath("https://example.test/v2/accounts/123")).toBeNull();
    expect(sanitizeBankinResourcePath("https://sync.bankin.com/health")).toBeNull();
  });
});
