import type { BankinHeaders } from "../types/bankin";

const capturableHeaders = new Set([
  "authorization",
  "bankin-version",
  "client-id",
  "client-secret",
  "accept",
  "content-type"
]);

export function extractBankinHeaders(
  requestHeaders: chrome.webRequest.HttpHeader[] | undefined
): BankinHeaders | null {
  const normalized = new Map<string, string>();

  for (const header of requestHeaders ?? []) {
    const name = header.name.toLowerCase();
    if (capturableHeaders.has(name) && header.value) {
      normalized.set(name, header.value);
    }
  }

  const authorization = normalized.get("authorization");
  if (!authorization) {
    return null;
  }

  return {
    authorization,
    bankinVersion: normalized.get("bankin-version"),
    clientId: normalized.get("client-id"),
    clientSecret: normalized.get("client-secret"),
    accept: normalized.get("accept"),
    contentType: normalized.get("content-type"),
    capturedAt: new Date().toISOString()
  };
}
