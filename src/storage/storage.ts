import type { BankinHeaders } from "../types/bankin";
import type { ExtensionSettings } from "../types/patrimoine";

const BANKIN_HEADERS_KEY = "bankinHeaders";
const SETTINGS_KEY = "settings";

const defaultSettings: ExtensionSettings = {
  appImportUrl: "http://localhost:3000/api/import/bankin",
  includeAccountsWithoutTransactions: true,
  showCsvExport: true,
  debugMode: false
};

export async function saveBankinHeaders(headers: BankinHeaders): Promise<void> {
  await chrome.storage.local.set({ [BANKIN_HEADERS_KEY]: headers });
}

export async function getBankinHeaders(): Promise<BankinHeaders | null> {
  const result = await chrome.storage.local.get(BANKIN_HEADERS_KEY);
  return result[BANKIN_HEADERS_KEY] ?? null;
}

export async function clearBankinHeaders(): Promise<void> {
  await chrome.storage.local.remove(BANKIN_HEADERS_KEY);
}

export async function clearAllLocalData(): Promise<void> {
  await chrome.storage.local.remove([BANKIN_HEADERS_KEY, SETTINGS_KEY]);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return {
    ...defaultSettings,
    ...result[SETTINGS_KEY]
  };
}
