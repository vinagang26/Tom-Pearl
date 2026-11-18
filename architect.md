# Tom Pearl architecture

## Modules and ownership

- `client/src/core`: pure matching, item checks, parser, scheduler, progression, deterministic session selection, statistics and rubric. No DOM, network or storage.
- `client/src/exercises`: seven modules, each exporting generate(item, ctx) and render(task, container, onResult). Timers and async work are disposed when the exercise ends.
- `client/src/screens`: home shell, Import, editable Review, Library, Session/Summary, Paragraph, Stats and Settings. Mutations replace a cloned state only after validated persistence succeeds.
- `client/src/storage`: localStorage access, migrations, import validation and export. Content/progress/writing are separate objects in a versioned envelope.
- `client/src/api`: same-origin JSON API, timeouts and explicit errors. No key in the browser.
- `client/src/ui`: text-safe DOM, SVG icons, accessible in-app confirmations and shared components.
- `shared/schemas.js`: zod Item, Extract/Enrich, grades, progress, writing and backup contracts used across boundaries.
- `server/src`: configuration, API dispatch, Express hosting with equivalent native HTTP fallback, local security/rate controls, document parsers, provider factory, semantic validation, batching and cache.
- `tests`: shared definitions consumed by both Vitest wrappers and Node's portable runner. Provider/document dispatch tests avoid real network charges.

## Runtime/build decisions

Node 22+ supports env-file loading, fetch and JSON-schema generation through zod 4. Normal development uses Vite plus the localhost API. Production builds use Vite when installed. A native ES-module distribution copies client/shared and the licensed zod ESM runtime, using an import map. That path was verified in the restricted authoring environment.

Express is the installed HTTP implementation. When absent, the built-in Node server uses the same service dispatch and security rules. Both bind 127.0.0.1; both reject foreign browser origins and invalid hostnames. Uploads are JSON with limits. The only persisted server data is an enrichment cache in ignored .cache/; vocabulary/progress remains browser-local.

`preview.html` is a compiled convenience build from the same frontend modules, including schemas. It runs no-key flows offline. Backend-only imports and AI require the localhost server. Separate origins have separate storage; JSON export/import is the bridge. Source is not monolithic.

## Learning invariants

Mastery changes at most one step. Recognition cannot earn production. New items make staged first attempts up to recall; a first failure freezes further mastery changes for that item in that session. Due reviews use one initial mastery change. Retries record history but never change mastery/timer tier. First-attempt statistics exclude retries. Sprints change tier only. Owned requires two distinct confirmed unprompted writing sessions while produced; ownership applies its 21-day interval.

Timed writing snapshots eligible topic IDs at the start. The target list stays hidden during writing. Local form matching is always applied; optional AI grades form/naturalness. The learner confirms usage labels before the log or ownership changes are saved. Forced/checked/absent use never earns ownership.

## Data safety

Imported/external text enters the DOM as text. Schemas check backups, API inputs and AI outputs. Ready context receives semantic checks. Duplicate merging retains stable IDs and progress. Writes are validated and saved before in-memory replacement. Bad stored data is backed up and refused rather than silently erased. Reset/restore require confirmation and download a prior backup. Cache/keys/dependencies/build output are ignored by Git.

## Verification limits

See STATE.md. Live providers and actual third-party document parser execution were not run. The final in-app confirmation revision and advanced production UI need a final manual browser pass after a browser-native dialog stalled the original test session.
