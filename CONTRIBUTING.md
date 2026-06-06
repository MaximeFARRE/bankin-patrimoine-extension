# Contributing

Thanks for your interest in improving Patrimoine Bankin Exporter.

This project handles financial data, so changes should stay conservative, explicit, and well tested.

## Development Setup

```bash
git clone https://github.com/MaximeFARRE/bankin-patrimoine-extension.git
cd bankin-patrimoine-extension
npm install
npm run build
```

Load `dist/` from `chrome://extensions` with Developer mode enabled.

## Before Opening A Pull Request

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For extension packaging changes, also run:

```bash
npm run zip
```

## Pull Request Guidelines

- Keep changes focused.
- Do not include real Bankin exports or screenshots with financial data.
- Add or update tests for normalization, validation, hashing, and CSV behavior.
- Keep Bankin API compatibility changes isolated and easy to review.
- Avoid adding analytics, telemetry, or remote logging.

## Commit Style

Use Conventional Commit messages:

- `feat: add export validation`
- `fix: handle missing category parent`
- `test: cover csv escaping`
- `docs: clarify privacy behavior`
- `chore: update build tooling`

## Bankin Compatibility

Bankin's internal Web API can change without notice. Compatibility changes should generally touch:

- `src/bankin/endpoints.ts`
- `src/bankin/captureHeaders.ts`
- `src/bankin/bankinClient.ts`
- `src/types/bankin.ts`

Please explain how the change was observed, without publishing sensitive request headers or real financial data.
