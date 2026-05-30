# Changelog

All notable changes to Membrane should be recorded here. Use short, human-readable entries grouped by date. This project does not currently publish versioned SDK packages from this repository.

## Unreleased

- Added contributor onboarding, security reporting, pull request templates, issue templates, and CI checks for the monorepo.
- Clarified that this repository contains the full Membrane backend plus dashboard/docs app, despite the historical `membrane-dashboard` name.
- Moved swarm experiment history from `tests/` into `docs/internal/` so the test folder only contains executable regression tests.

## 2026-05-29

- Hardened production admin routes behind explicit admin authentication.
- Made production webhook and backend authentication paths fail closed when required secrets or database state are missing.
- Removed development-only server reload defaults from production startup.
- Verified the dashboard build, lint, TypeScript check, backend unit tests, and local smoke pages before release review.
