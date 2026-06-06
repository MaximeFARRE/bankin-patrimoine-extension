import { describe, expect, it } from "vitest";
import { buildTransactionHash, normalizeLabel } from "./hash";

describe("normalizeLabel", () => {
  it("normalizes spaces, case and accents", () => {
    expect(normalizeLabel("  Café   DU   Centre  ")).toBe("cafe du centre");
  });
});

describe("buildTransactionHash", () => {
  it("is stable for equivalent labels", async () => {
    const first = await buildTransactionHash({
      sourceAccountId: "account-1",
      date: "2026-06-06",
      amount: -12.5,
      currency: "EUR",
      labelRaw: "Café du centre"
    });
    const second = await buildTransactionHash({
      sourceAccountId: "account-1",
      date: "2026-06-06",
      amount: -12.5,
      currency: "EUR",
      labelRaw: "  CAFE   DU CENTRE "
    });

    expect(first).toBe(second);
  });
});
