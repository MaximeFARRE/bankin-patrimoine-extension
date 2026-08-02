# Changelog

All notable changes to this project will be documented in this file.

This project follows Conventional Commits where practical.

## Unreleased

### Added

- Additive JSON export format 2.0 with account classification, loans, positions, and duplicate statistics.
- Conservative classification for regulated savings, housing savings, securities accounts, and common loans.
- Safe diagnostic mode for observed Bankin resources, schemas, type values, and relationship counts.
- Account type and subtype columns in the transaction CSV.

### Changed

- Duplicate transaction hashes remain warnings with group, affected-line, and excess-line counts.
- Duplicate Bankin transaction identifiers remain blocking validation errors.
- JSON is documented as canonical; CSV is explicitly transaction-oriented.

## [1.0.0] - 2026-06-06

### Added

- Chrome Manifest V3 extension scaffold with Vite and TypeScript.
- Local Bankin header capture through `chrome.webRequest`.
- Bankin accounts, categories, and transactions fetching.
- Pagination support with a safety limit.
- Normalization into `PatrimoineBankinExport`.
- JSON export.
- CSV transaction export.
- Optional import to a configured patrimoine app endpoint.
- Popup settings for import URL, import key, default start date, CSV visibility, account inclusion, and debug mode.
- Local export validation and warning reporting.
- Unit tests and GitHub Actions CI.
