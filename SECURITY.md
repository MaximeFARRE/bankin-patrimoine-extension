# Security Policy

## Sensitive Data

Do not open public issues or pull requests containing:

- Bankin passwords;
- Bankin authorization headers;
- `Client-Id` or `Client-Secret` values captured from Bankin requests;
- exported JSON or CSV files with real financial data;
- import keys;
- screenshots showing balances, account names, or transactions.

If you need to describe a bug, redact all personal and financial data first.

## Responsible Disclosure

If you find a security issue, please report it privately to the repository owner instead of opening a public issue.

Suggested report content:

- short description of the issue;
- affected version or commit;
- steps to reproduce with fake data where possible;
- expected impact;
- proposed mitigation if you have one.

## Security Design

The extension is designed so that:

- Bankin credentials are never requested;
- Bankin request headers are stored locally only;
- Bankin request headers are never sent to the configured patrimoine app;
- exported files are generated locally by the browser;
- optional imports send normalized data only.

## Supported Versions

This project is currently in early public beta. Security fixes target the latest `main` branch and the latest published release.
