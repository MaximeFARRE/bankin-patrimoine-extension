export function normalizeLabel(label: string): string {
  return label
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function buildTransactionHash(tx: {
  sourceAccountId: string;
  date: string;
  amount: number;
  currency: string;
  labelRaw: string;
}): Promise<string> {
  const raw = [
    tx.sourceAccountId,
    tx.date,
    tx.amount.toFixed(2),
    tx.currency,
    normalizeLabel(tx.labelRaw)
  ].join("|");

  return sha256(raw);
}
