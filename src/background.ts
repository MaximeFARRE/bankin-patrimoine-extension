import { extractBankinHeaders } from "./bankin/captureHeaders";
import { recordBankinResource, saveBankinHeaders } from "./storage/storage";
import { logger } from "./utils/logger";

logger.info("service worker pret");

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = extractBankinHeaders(details.requestHeaders);

    if (!headers) {
      return;
    }

    void Promise.all([saveBankinHeaders(headers), recordBankinResource(details.url, details.method)])
      .then(() => {
        logger.info("headers Bankin captures", { capturedAt: headers.capturedAt });
      })
      .catch((error: unknown) => {
        logger.error("impossible de sauvegarder les headers Bankin", error);
      });
  },
  {
    urls: [
      "https://sync.bankin.com/v2/*",
      "https://sync.bankin.com/v3/*"
    ],
    types: ["xmlhttprequest"]
  },
  ["requestHeaders", "extraHeaders"]
);
