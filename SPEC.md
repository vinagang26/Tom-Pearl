# Tom Pearl product brief

Adapted from the user-supplied Chunk Ladder specification. Product name: **Tom Pearl**.

## Goal

Turn collected IELTS collocations and idioms into vocabulary used naturally under exam pressure. Pipeline: Import → Extract → Enrich → Review → Practice → Writing test → Stats. Measure spontaneous usage rather than recognition alone.

## Stack and structure

ES modules, Node 20+, npm workspaces: client (Vite vanilla JS), server (Express or Fastify), shared (zod). Vitest, minimal dependencies, plain fetch for provider APIs. Server binds localhost only; all API keys remain in server environment. Models configurable through env, no hardcoded model names. UI English; meanings Vietnamese and/or English. Browser-local versioned storage with migrations and validated JSON backup.

## Data

Item: id, text, kind, pos, meaningVi, meaningEn, forms, example, distractors, prompts, scenarios, topic, function, template, status basic/ready, importId, createdAt.
Progress: itemId, level 0–5, dueAt, timerTier 0–2, spontaneousSessionIds, history (ts, exerciseType, correct, responseMs).
Writing log: id, ts, topic, prompt, durationSec, text, wordCount, usage per item (unprompted/forced/checked/none), optional aiFeedback.

## Ladder and spacing

0 New → 1 Recognized (match/choose) → 2 Built (tiles) → 3 Recalled (type) → 4 Produced (sentence + AI or self-rubric) → 5 Owned (level-4 item used unprompted in two distinct writing sessions). One-level promotion maximum; first-attempt failure demotes, with floor 1 once recognized. Retry does not alter level. Intervals 1/2/3/7/21 calendar days. Sprint changes timer tier only: 90/45/25 seconds.

## Sessions

Default 5 new + 10 due reviews; editable. Overdue and lower-level reviews first; group new items by topic. Recognition → build → recall → produce → pressure bands; interleave items. New items stop at level 3. Failed tasks repeat once without changing mastery. Basic items use only context-free exercises. No hearts, XP or streaks.

## Exercises

Five-item meaning matching; choose correct gap phrase/idiom scenario; tile building with two distractor words; typed item with hints only at level 2; typed example gap; own sentence with target-presence gate and AI or three-checkbox self-rubric; timed sprint. Accept forms, normalize case/spacing/hyphens, enforce word boundaries. Sentence grading requires correct use + grammar + naturalness; user can override.

## Import and AI

Paste, text, Markdown, images, PDF and docx. Heuristic parser first; only messy text/images go to extraction AI. Batched enrichment ≤15 items; normalized cache; validate each response, retry once, then show a clear error. Providers: OpenAI and Anthropic. Without a key, text parsing and basic practice remain usable. Editable review, validation badges, accept all, regenerate, skip/merge duplicates.

## Writing and stats

Timed paragraphs: 5/4/3 minutes, idea prompt, no visible item list. Match forms and AI-grade usage, then user confirms unprompted/forced/checked/none for eligible topic items at level 2+. Only confirmed unprompted usage can earn Owned. Matcher-only fallback.
Stats: level distribution, first-attempt accuracy by exercise, median response time for recall and production, due today/next seven days, spontaneous use per writing session and last five sessions, writing log.

## Milestones

- M1: scaffold, shared schemas, pure core, storage and tests.
- M2: localhost API, providers, heuristic parsing, extraction/enrichment, Import/Review.
- M3: practice engine, exercises 1–5, Session/Summary.
- M4: own sentence, sprint, writing, AI grading and fallback.
- M5: image/document import, complete Stats/Library/Settings, README.

After each milestone: npm test, npm run build, browser verification when available, documentation and local commit. Full done: install/dev starts client+server, tests/build pass, complete key/no-key paths and validated export/import. No accounts, sync, audio, mobile packaging or multi-user support.
