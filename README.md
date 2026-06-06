# Patrimoine Bankin Exporter

Chrome extension that exports Bankin Web data into a clean JSON/CSV format for personal finance and net-worth tracking apps.

The extension runs locally in the user's browser. It does not ask for Bankin credentials, does not store passwords, and does not send Bankin authentication headers to any third-party server.

> Non-official project. This extension is not affiliated with, endorsed by, or sponsored by Bankin.

## What It Does

- Detects an active Bankin Web session.
- Captures the required Bankin API request headers locally in `chrome.storage.local`.
- Fetches accounts, categories, and transactions from Bankin's web API.
- Handles pagination.
- Normalizes Bankin data into a stable `PatrimoineBankinExport` JSON format.
- Exports JSON and optional CSV files.
- Displays a clear export summary: accounts, categories, transactions, period, validation warnings, and errors.
- Can optionally send the normalized export to a configured personal app endpoint.

## What It Does Not Do

- It never asks for your Bankin password.
- It never stores Bankin credentials.
- It never sends Bankin tokens or headers to the target patrimoine app.
- It does not scrape Bankin from a server.
- It does not connect to Bankin on your behalf.
- It does not provide financial advice, budget analysis, charts, or PDF reports.

## Current Status

The extension is in early public beta.

The core export flow has been tested against a real Bankin Web session, but Bankin's internal API can change without notice. If an endpoint or required header changes, update:

- `src/bankin/endpoints.ts`
- `src/bankin/captureHeaders.ts`
- `src/bankin/bankinClient.ts`

## Data And Privacy

Bankin session headers are stored only in the user's local Chrome extension storage. Exported files are generated locally by the browser.

If the optional "Send to my app" action is used, only the normalized patrimoine export is sent to the configured URL. Bankin authentication headers are never included in that request.

Read the full privacy notes in [PRIVACY.md](PRIVACY.md).

## Installation For Local Testing

```bash
git clone https://github.com/MaximeFARRE/bankin-patrimoine-extension.git
cd bankin-patrimoine-extension
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select the `dist/` folder.
5. Open Bankin Web and sign in normally.
6. Navigate through accounts or transactions so the extension can capture the active session.
7. Open the extension popup.

## Usage

1. Open Bankin Web and sign in normally.
2. Open a Bankin page that triggers API calls, such as accounts or transactions.
3. Open the extension popup.
4. Click `Test connection`.
5. Choose a date range if needed.
6. Click `Preview` to check counts, period, and validation warnings.
7. Export JSON or CSV.

The extension validates the export before download or import:

- required account/category/transaction fields;
- account and category references;
- duplicate Bankin transaction IDs;
- duplicate transaction hashes.

Duplicate transaction hashes are warnings, not blocking errors, because real transactions can share the same account, date, amount, currency, and normalized label.

## Optional App Import

The popup settings can configure:

- `appImportUrl`, for example `http://localhost:3000/api/import/bankin`;
- `importKey`;
- default start date;
- whether to include accounts without transactions in the selected period;
- whether to show the CSV export button;
- diagnostic mode.

The expected app endpoint is:

```http
POST /api/import/bankin
Content-Type: application/json
X-Import-Key: <user-import-key>
```

The request body is a `PatrimoineBankinExport`. Bankin headers are never sent.

## Export Format

Top-level JSON shape:

```ts
type PatrimoineBankinExport = {
  source: "bankin";
  exportedAt: string;
  exportVersion: "1.0";
  accounts: PatrimoineAccount[];
  categories: PatrimoineCategory[];
  transactions: PatrimoineTransaction[];
  metadata: {
    transactionCount: number;
    accountCount: number;
    categoryCount: number;
    fromDate?: string;
    toDate?: string;
  };
};
```

See [src/types/patrimoine.ts](src/types/patrimoine.ts) for the full schema.

## Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run zip
```

The Chrome-loadable extension is built into `dist/`.

## Packaging

```bash
npm run zip
```

This creates a versioned archive:

```text
patrimoine-bankin-exporter-<version>.zip
```

## Repository Structure

```text
src/
  background.ts
  popup/
  bankin/
  export/
  app/
  storage/
  types/
  utils/
```

## Publication Notes

For normal users and automatic updates, Chrome Web Store distribution is recommended. An unlisted or public listing can both be free and can both receive automatic updates through Chrome.

Self-hosted CRX updates are not a good default for regular Chrome users on macOS/Windows unless they are in a managed enterprise environment.

## Security

Please do not open public issues containing personal financial data, Bankin headers, exported JSON files, import keys, screenshots with account balances, or any other sensitive information.

See [SECURITY.md](SECURITY.md) for responsible disclosure guidance.

## Contributing

Contributions are welcome, especially around:

- Bankin endpoint/header compatibility;
- export validation;
- import format stability;
- tests;
- Chrome Web Store packaging.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).
