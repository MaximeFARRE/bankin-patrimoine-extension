import type { PatrimoineBankinExport, PatrimoineTransaction } from "../types/patrimoine";
import { formatExportTimestamp } from "../utils/dates";

const columns: Array<keyof PatrimoineTransaction> = [
  "source",
  "sourceTransactionId",
  "sourceAccountId",
  "accountName",
  "bankName",
  "date",
  "valueDate",
  "amount",
  "currency",
  "labelRaw",
  "labelClean",
  "sourceCategoryId",
  "categoryName",
  "transactionHash"
];

function escapeCsvValue(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function buildTransactionsCsv(data: PatrimoineBankinExport): string {
  const rows = [
    columns.join(";"),
    ...data.transactions.map((transaction) => columns.map((column) => escapeCsvValue(transaction[column])).join(";"))
  ];

  return `\uFEFF${rows.join("\r\n")}`;
}

export async function downloadCsvExport(data: PatrimoineBankinExport): Promise<void> {
  const blob = new Blob([buildTransactionsCsv(data)], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);

  await chrome.downloads.download({
    url,
    filename: `bankin-export-${formatExportTimestamp()}.csv`,
    saveAs: true
  });

  URL.revokeObjectURL(url);
}
