import type { BankinAccount } from "../types/bankin";
import type {
  PatrimoineAccountKind,
  PatrimoineAccountSubtype,
  PatrimoineBalanceKind
} from "../types/patrimoine";

export type AccountClassification = {
  accountKind: PatrimoineAccountKind;
  accountSubtype: PatrimoineAccountSubtype;
  balanceKind: PatrimoineBalanceKind;
  isAsset: boolean;
  isLiability: boolean;
};

type KindAndSubtype = Pick<AccountClassification, "accountKind" | "accountSubtype">;

function searchable(value?: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function classifyExplicitType(type?: string): KindAndSubtype | null {
  const value = searchable(type).replace(/ /g, "_");
  if (["checking", "current", "current_account"].includes(value)) return { accountKind: "checking", accountSubtype: "current" };
  if (["savings", "saving", "savings_account"].includes(value)) return { accountKind: "savings", accountSubtype: "unknown" };
  if (["investment", "investments", "securities", "portfolio", "brokerage"].includes(value)) return { accountKind: "investment", accountSubtype: "unknown" };
  if (["loan", "loans", "credit", "mortgage"].includes(value)) return { accountKind: "loan", accountSubtype: value === "mortgage" ? "mortgage" : "unknown" };
  if (["card", "credit_card"].includes(value)) return { accountKind: "card", accountSubtype: "unknown" };
  return null;
}

function classifyText(value?: string): KindAndSubtype | null {
  const text = ` ${searchable(value)} `;
  const rules: Array<[RegExp, KindAndSubtype]> = [
    [/\bpea\s*pme\b/, { accountKind: "investment", accountSubtype: "pea_pme" }],
    [/\bpea\b/, { accountKind: "investment", accountSubtype: "pea" }],
    [/\b(?:cto|compte titres?)\b/, { accountKind: "investment", accountSubtype: "cto" }],
    [/\blivret\s+jeune\b/, { accountKind: "savings", accountSubtype: "livret_jeune" }],
    [/\blivret\s+a\b/, { accountKind: "savings", accountSubtype: "livret_a" }],
    [/\b(?:ldds|livret developpement durable)\b/, { accountKind: "savings", accountSubtype: "ldds" }],
    [/\b(?:lep|livret epargne populaire)\b/, { accountKind: "savings", accountSubtype: "lep" }],
    [/\bpel\b/, { accountKind: "savings", accountSubtype: "pel" }],
    [/\bcel\b/, { accountKind: "savings", accountSubtype: "cel" }],
    [/\b(?:credit|pret)\s+(?:immobilier|immo)\b/, { accountKind: "loan", accountSubtype: "mortgage" }],
    [/\b(?:credit|pret)\s+(?:consommation|conso)\b/, { accountKind: "loan", accountSubtype: "consumer_loan" }],
    [/\b(?:credit|pret)\s+etudiant\b/, { accountKind: "loan", accountSubtype: "student_loan" }]
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

function detailsFor(kind: PatrimoineAccountKind): Pick<AccountClassification, "balanceKind" | "isAsset" | "isLiability"> {
  if (kind === "checking" || kind === "savings") return { balanceKind: "cash", isAsset: true, isLiability: false };
  if (kind === "investment") return { balanceKind: "market_value", isAsset: true, isLiability: false };
  if (kind === "loan") return { balanceKind: "outstanding_debt", isAsset: false, isLiability: true };
  return { balanceKind: "unknown", isAsset: false, isLiability: false };
}

export function classifyBankinAccount(account: Pick<BankinAccount, "type" | "subtype" | "name">): AccountClassification {
  const explicitType = classifyExplicitType(account.type);
  const explicitSubtype = classifyText(account.subtype);
  const inferredName = classifyText(account.name);
  const base = explicitType ?? explicitSubtype ?? inferredName ?? { accountKind: "unknown", accountSubtype: "unknown" };
  const compatibleSubtype = explicitSubtype ?? inferredName;
  const accountSubtype = compatibleSubtype?.accountKind === base.accountKind ? compatibleSubtype.accountSubtype : base.accountSubtype;
  return { accountKind: base.accountKind, accountSubtype, ...detailsFor(base.accountKind) };
}
