# Privacy Policy

Last updated: 2026-06-06

Patrimoine Bankin Exporter is a non-official Chrome extension that helps users export their own Bankin Web data.

## Data Processed By The Extension

The extension can process:

- Bankin API request headers required to call Bankin Web endpoints from the browser;
- Bankin accounts;
- Bankin categories;
- Bankin transactions;
- local extension settings, such as an import URL, import key, default start date, and display options.

## Local Storage

Bankin request headers and extension settings are stored in `chrome.storage.local`.

They stay on the user's device unless the user explicitly exports a file or sends normalized data to a configured app endpoint.

## Data Export

The extension can generate:

- a JSON export;
- an optional CSV export.

Exports are created locally by the browser and downloaded by Chrome.

Do not share exported files publicly. They can contain sensitive financial data.

## Optional Import To A Personal App

If the user clicks `Send to my app`, the extension sends the normalized export to the configured `appImportUrl`.

The extension sends:

- normalized accounts;
- normalized categories;
- normalized transactions;
- export metadata;
- the configured import key in the `X-Import-Key` header.

The extension does not send:

- Bankin passwords;
- Bankin authentication headers;
- Bankin raw session tokens;
- Chrome cookies.

## Third Parties

This project does not include analytics, tracking, ads, telemetry, or remote logging.

The extension only communicates with:

- Bankin Web API endpoints, using the user's active browser session;
- the optional user-configured patrimoine app import endpoint.

## Clearing Data

The popup includes controls to clear:

- the captured Bankin session;
- all local extension data.

Users can also remove all extension data by uninstalling the extension from `chrome://extensions`.

## Contact

Please do not open public GitHub issues containing financial exports, account data, Bankin headers, or import keys.

For sensitive reports, follow [SECURITY.md](SECURITY.md).
