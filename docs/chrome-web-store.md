# Chrome Web Store Publication Checklist

This project can be distributed through the Chrome Web Store as an unlisted or public free extension.

## Recommended Listing Positioning

- Make it clear that the extension is non-official and not affiliated with Bankin.
- Explain that the user must already be signed in to Bankin Web.
- Explain that the extension runs locally in the browser.
- Explain that Bankin headers are never sent to the configured patrimoine app.
- Link to `PRIVACY.md`.

## Required Assets

Chrome Web Store publication usually requires:

- extension package ZIP;
- short description;
- detailed description;
- icon assets;
- screenshots;
- privacy policy;
- justification for permissions.

## Permission Justification

Suggested explanations:

- `storage`: store extension settings and captured Bankin session metadata locally.
- `webRequest`: observe outgoing Bankin Web API requests and capture the headers required to fetch the user's own Bankin data from the browser.
- `downloads`: export JSON and CSV files from the browser.
- `host_permissions` for Bankin: call Bankin Web API endpoints from the user's active browser session.
- `host_permissions` for the configured app: optional import to the user's patrimoine app endpoint.

## Release Flow

1. Update `version` in `package.json` and `manifest.json`.
2. Update `CHANGELOG.md`.
3. Run:

   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   npm run zip
   ```

4. Upload the generated `patrimoine-bankin-exporter-<version>.zip`.
5. Test the published version with a non-sensitive Bankin export flow.

## Notes

Self-hosted CRX updates are not recommended for regular Chrome users on macOS/Windows. Chrome Web Store distribution is the most practical path for automatic updates.
