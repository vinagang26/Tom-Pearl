# Changelog

## 2026-11-18 — MVP workflows implemented

- Completed the local API, provider adapters, validated extraction/enrichment, batching/cache and upload paths.
- Replaced the recognition placeholder with matching rounds and added contextual choices, gaps, production, sprint and writing workflows.
- Added confirmed unprompted ownership, full statistics, filtered library, editable review and JSON file/paste backup restore.
- Added in-app confirmation dialogs after a native browser dialog stalled verification; kept Settings reachable on mobile.
- Added shared Vitest/Node regression definitions, native build/server fallback and a compiled standalone no-key frontend.
- Verification: 32 portable tests, native production build, standalone offline boot and HTTP smoke tests pass. Browser verified basic import/lesson/writing flows and 360px layout. Live AI, actual PDF/docx parser libraries, Vite/Vitest-specific runners and the final advanced UI/confirmation pass remain unverified; see STATE.md.

## 2026-11-18 — initial implementation (unreleased)

- Created Tom Pearl as an independent project with client/server/shared/fixtures and maintainer documents.
- Added original pearl visual identity, responsive learning home, tactile controls, lesson path and topic collections.
- Added text/Markdown import preview, duplicate skipping, editable item fields and local saving.
- Added initial recognition-choice, tile-building and recall flow, immediate feedback, one retry and session summary.
- Added matching/progression/session/parser logic, browser storage, JSON backup, settings and honest empty-history statistics.
- Added initial Vitest regression suite. Tests and build remain unverified due to absent Node and blocked network in the shell environment. Not a completed MVP or completed milestone.
