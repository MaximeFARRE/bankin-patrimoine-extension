import { describe, expect, it } from "vitest";
import { classifyBankinAccount } from "./accountClassification";

describe("classifyBankinAccount", () => {
  it.each([
    ["Mon Livret A", "savings", "livret_a"],
    ["Livret Jeune", "savings", "livret_jeune"],
    ["LDDS", "savings", "ldds"],
    ["LEP", "savings", "lep"],
    ["Plan PEL", "savings", "pel"],
    ["Compte CEL", "savings", "cel"],
    ["PEA", "investment", "pea"],
    ["PEA-PME", "investment", "pea_pme"],
    ["Compte titres", "investment", "cto"],
    ["Credit immobilier", "loan", "mortgage"],
    ["Pret consommation", "loan", "consumer_loan"],
    ["Credit a la consommation", "loan", "consumer_loan"],
    ["Pret etudiant", "loan", "student_loan"]
  ] as const)("infers %s conservatively", (name, accountKind, accountSubtype) => {
    expect(classifyBankinAccount({ name })).toMatchObject({ accountKind, accountSubtype });
  });

  it("uses an explicit Bankin type before a conflicting name", () => {
    expect(classifyBankinAccount({ type: "checking", name: "PEA ambigu" })).toMatchObject({
      accountKind: "checking",
      accountSubtype: "current",
      balanceKind: "cash"
    });
  });

  it("uses an explicit subtype when the type is not recognized", () => {
    expect(classifyBankinAccount({ type: "other", subtype: "PEA PME" })).toMatchObject({
      accountKind: "investment",
      accountSubtype: "pea_pme",
      balanceKind: "market_value",
      isAsset: true
    });
  });

  it("never defaults an ambiguous account to checking", () => {
    expect(classifyBankinAccount({ type: "other", name: "Poche USD" })).toEqual({
      accountKind: "unknown",
      accountSubtype: "unknown",
      balanceKind: "unknown",
      isAsset: false,
      isLiability: false
    });
  });
});
