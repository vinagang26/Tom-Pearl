# Tom Pearl: current state

## 2026-11-18 — MVP implementation

Tom Pearl is independent of SON. The original SON source was not modified.

### Implemented

- M1: workspace scaffold; shared zod data/API/backup schemas; parser/matcher; calendar scheduler; mastery transitions; deterministic session builder and availability rules; versioned storage/migration/validated backups; shared Vitest/Node test cases.
- M2: localhost API, OpenAI/Anthropic fetch adapters, validation/one retry, heuristic extraction, batched enrichment/cache, provider status/counter, editable Import/Review, duplicate skip/merge.
- M3: real matching rounds, choices, tiles, typed recall and gaps, mixed session UI, first-attempt accounting, one retry loop, summary and save handling.
- M4: own sentence, explicit self-rubric fallback, verdict override, timed sprint tiers, timed writing, local/AI usage detection, learner confirmation, distinct-session ownership and writing logs.
- M5: image/PDF/docx import paths, complete filters/editing/enrichment in Library, stats, Settings, JSON file/paste restore, backup-before-reset and documentation. Original pearl identity and responsive interface retained.

### Verification

- 32 portable automated tests pass (same case definitions as the Vitest wrappers).
- Native ES-module production build passes. Standalone frontend bundles the actual client and zod modules; offline initialization check passes.
- HTTP server ran locally; actual HTTP tests cover health, parsing, malformed JSON, origin rejection and static output.
- Browser verified: desktop layout, text import, editable review, duplicate skipping, saving, recognition/build/recall through summary, persistence, timed writing, usage confirmation and stats.
- 360px layout checked: document client width and scroll width both 360px. Settings remains reachable from the header on mobile.
- Backup browser check hit a native dialog/session failure. Browser confirmations have been replaced with accessible in-app dialogs. Revised flows parse/build successfully; final restore and advanced production browser checks remain unverified in that session.
- No real provider key or paid call used. Adapters, retries, schemas, batching/cache and parser dispatch use mocks in tests.
- npm/Vite/Vitest and the actual mammoth/pdf-parse packages could not be installed in this restricted environment. Native build, portable tests and HTTP runtime were executed with the available Node-compatible runtime.

### Handoff / residual checks

1. On a Node-enabled unrestricted machine: npm install, npm test, npm run build, npm start.
2. Smoke-test actual PDF/docx libraries with local files, then configure an optional provider and verify one screenshot, one enrichment, sentence grading and paragraph grading.
3. Complete browser checks of revised restore/reset/leave dialogs, own-sentence fallback and sprint timeout. Automated learning/timer invariants pass; these UI checks are not claimed complete.
4. Review generated idioms/register and distractors before accepting them. Self-assessed production and confirmed unprompted use depend on honest learner labels.
