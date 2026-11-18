# Tom Pearl

Make words yours. A local IELTS collocation and idiom trainer with Duolingo-inspired task flow and an original pearl identity.

## Try it

Open `preview.html` in a modern browser to use the complete frontend in local mode. It bundles the actual application modules and validation library. Pasted text, text/Markdown import, manual review/editing, mixed lessons, self-assessed production, timed writing, statistics and JSON backups work without an AI key. Data stays in that browser/origin; preview and localhost have separate storage. Export/import JSON to move between them.

For AI extraction/grading and PDF/Word parsing, run the local server:

```sh
npm install
npm run dev
```

Requires Node 22+ (22.13+ recommended). Development starts the localhost API at http://127.0.0.1:8173 and Vite at http://127.0.0.1:5173. Open the Vite URL in development. Keep the same browser and origin for your saved library.

For the production app:

```sh
npm run build
npm start
```

Open http://127.0.0.1:8173. The server binds only to `127.0.0.1`. `build` uses Vite when installed; a native ES-module build is available when only zod is installed. The server similarly uses Express when installed, with a matching Node HTTP fallback for restricted environments. These are real builds/routes, not mocked provider behavior.

## AI setup

Copy `.env.example` to `.env` in the project root. Set `LLM_PROVIDER` to `openai` or `anthropic`, `LLM_MODEL` to a text-and-vision model supported by your provider, and the corresponding key. Restart the server after changes. Model IDs are intentionally not hardcoded. Never add `.env` to Git or put keys in browser code. Settings shows connection/provider/model status and the request counter, never the key.

Provider calls use fetch, validate JSON with shared zod schemas, retry once on failure, and fail clearly. Enrichment batches are at most 15 items. Cached normalized source phrases are reused from `.cache/enrichment.json`. Delete that cache or use Regenerate when you deliberately want new enrichment. Review all generated examples, distractors, register and idiom suitability.

There is no AI subscription included. AI requests can incur provider charges based on model and token usage. Importing 15 items uses one enrichment call, or two if validation fails. Sentence and paragraph grading normally use one call per submission, with one retry maximum. Re-importing cached items makes no enrichment calls. Local/no-key practice makes no paid requests.

## Learning pipeline

1. **Import:** paste vocabulary notes or upload `.txt`, `.md`, `.pdf`, `.docx`, or up to five screenshots. Structured text uses the heuristic parser first; only messy leftover text and images are sent for AI extraction. PDFs/docx are converted locally by server parsers. Scanned PDFs need page screenshots and a vision-capable model.
2. **Review:** edit phrases, kinds, meanings, examples, accepted forms, distractors, idea prompts, scenarios, templates, topic and function. Context lists use one entry per line. Duplicate imports can skip or merge while retaining progress. Regenerate is explicit. Invalid/incomplete context is marked; valid text with a meaning can still save as Basic.
3. **Practice:** due reviews first within difficulty bands; new items prefer one topic. Mixed matching, choices, tiles, typed recall/gaps, sentence production and timed sprints. Each failed task is retried once without another mastery change. Enter checks/continues; Shift+Enter adds a line in sentence production.
4. **Writing:** choose topic and 5/4/3 minutes. No target list is visible while writing. After submission, review detected usage and confirm Unprompted / Forced / Checked / Not used. Only confirmed natural unprompted use counts. Without AI, detection is local and the naturalness assessment is yours.
5. **Stats:** mastery distribution, first-attempt accuracy by exercise, median typed/production response times, due today/next seven days, writing logs, per-test spontaneous-use rate and aggregate over the last five tests.

## Mastery rules

| Level | Meaning | Evidence |
|---|---|---|
| 0 | New | Not yet recognized |
| 1 | Recognized | Meaning matching or contextual choice |
| 2 | Built | Word building; nearest available fallback for missing context |
| 3 | Recalled | Typed recall or typed gap |
| 4 | Produced | Correct, grammatical, natural sentence; AI or clearly marked self-rubric |
| 5 | Owned | Level-4 item confirmed unprompted in two distinct writing sessions |

Success promotes at most one level and only up to the exercise's evidence ceiling. New items can make staged first attempts up to level 3 in one session. Their first failure freezes further mastery changes for that session; review items change mastery only on their first attempt. Failure demotes with a floor of 1 once recognized. Retry history is kept but excluded from first-attempt accuracy. Sprint results change timer tier, not mastery.

Intervals are 1/2/3/7/21 calendar days. Sprint tiers are 90/45/25 seconds. Configure them in `client/src/config.js`. New/review session sizes are editable in Settings. Basic items only get exercises whose context is available; production requires validated Ready context.

## Storage and backups

Content, progress and writing logs remain separate objects inside a versioned, atomically saved browser envelope. Version-1 data migrates to version 2. Malformed saved JSON is preserved before refusing to open it. Backups are validated before replacing data; restore/reset downloads a copy of current data first. JSON restore accepts a file or pasted text. Export frequently; browser-local data does not sync across devices or origins.

## Checks

```sh
npm test
npm run test:portable
npm run build
npm run preview:build
node scripts/check-standalone.mjs
```

Vitest and Node's portable runner execute the same shared test cases. Server tests use fake providers, not live paid calls. PDF/docx parser dispatch has fixture-based tests; actual third-party parser execution still needs `npm install` and a local file smoke test.

In the authoring environment, all 32 portable tests, the native distribution build and standalone offline startup check passed. Real-browser checks covered desktop rendering, import/edit/save/duplicate skipping, matching/tiles/recall, lesson summary, persistence, writing detection/confirmation/stats, and 360px width without horizontal overflow. A browser-native confirmation stalled the backup test; confirmations were replaced with in-app dialogs. The replacement was syntax-checked; that browser session could not complete the final restore/production interaction checks. Live provider calls, actual PDF/docx libraries, Vitest runner and Vite-specific bundling were not run because keys/dependencies were unavailable. These limits are recorded in STATE.md.

## Project workflow

Read AGENTS.md, STATE.md, PIVD.md, architect.md and changelog.md. SPEC.md records the product brief. Changes are committed locally, never pushed automatically. `fixtures/qa-production-backup.json` is controlled test data, not a claim of real learning progress. The compiled preview is a convenience artifact; application source stays multi-file.
