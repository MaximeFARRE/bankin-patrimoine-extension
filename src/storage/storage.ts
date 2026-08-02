import type { BankinHeaders, BankinObservedResource } from "../types/bankin";
import type { ExtensionSettings } from "../types/patrimoine";

const BANKIN_HEADERS_KEY = "bankinHeaders";
const SETTINGS_KEY = "settings";
const OBSERVED_RESOURCES_KEY = "observedBankinResources";

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
  await chrome.storage.local.remove([BANKIN_HEADERS_KEY, SETTINGS_KEY, OBSERVED_RESOURCES_KEY]);
}

export function sanitizeBankinResourcePath(rawUrl: string): string | null {
  const url = new URL(rawUrl);
  if (url.hostname !== "sync.bankin.com" || !/^\/v[23]\//.test(url.pathname)) return null;

  const segments = url.pathname.split("/").map((segment) => {
    const looksLikeIdentifier = /^\d+$/.test(segment) || /^[0-9a-f-]{16,}$/i.test(segment) || segment.length > 40;
    return looksLikeIdentifier ? ":id" : segment;
  });
  return segments.join("/");
}

export async function recordBankinResource(rawUrl: string, method: string): Promise<void> {
  const settings = await getSettings();
  const resourcePath = sanitizeBankinResourcePath(rawUrl);
  if (!settings.debugMode || !resourcePath) return;

  const resources = await getObservedBankinResources();
  const existing = resources.find((resource) => resource.resourcePath === resourcePath && resource.method === method);
  if (existing) {
    existing.callCount += 1;
    existing.lastObservedAt = new Date().toISOString();
  } else {
    resources.push({ resourcePath, method, callCount: 1, lastObservedAt: new Date().toISOString() });
  }
  await chrome.storage.local.set({ [OBSERVED_RESOURCES_KEY]: resources });
}

export async function getObservedBankinResources(): Promise<BankinObservedResource[]> {
  const result = await chrome.storage.local.get(OBSERVED_RESOURCES_KEY);
  return result[OBSERVED_RESOURCES_KEY] ?? [];
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
