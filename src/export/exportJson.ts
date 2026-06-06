import type { PatrimoineBankinExport } from "../types/patrimoine";
import { formatExportTimestamp } from "../utils/dates";

export async function downloadJsonExport(data: PatrimoineBankinExport): Promise<void> {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);

  await chrome.downloads.download({
    url,
    filename: `bankin-export-${formatExportTimestamp()}.json`,
    saveAs: true
  });

  URL.revokeObjectURL(url);
}
