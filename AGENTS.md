# Tom Pearl: agent rules

Tom Pearl is a standalone IELTS collocation and idiom trainer. The original requirements live in `SPEC.md`. This repository is independent of SON.

## Session workflow

1. Read this file, README.md, STATE.md, current Git changes, and relevant code before editing.
2. For bugs, follow PIVD.md. For features, state intended behavior and inspect ownership first.
3. Consult architect.md for boundaries. Make the smallest coherent change.
4. Run `npm test` and `npm run build` after each milestone (when installation is blocked, run the same shared cases with `npm run test:portable` and the native build, recording the limitation); browser-check behavior and responsive layouts when available. Report actual commands and results; never claim unperformed verification.
5. Update STATE.md and changelog.md. Update architect.md for architecture decisions.
6. After a completed, verified task, create one local conventional commit with reason, changes, verification and remaining limitations. Stage only task files. Never push without an explicit request. Do not commit an incomplete milestone as completed.

## Architecture and safety

- Follow client/, server/, shared/, fixtures/ structure. JavaScript ES modules; Vite vanilla client; Node 20+ server; shared zod schemas; Vitest with a shared Node test fallback. No UI framework.
- Pure learning logic belongs in client/src/core. UI must not contain scoring or scheduling rules.
- Storage access belongs only in client/src/storage. Content and learning progress remain separate objects. Backup before resetting corrupt data. Validate all imports.
- Render user and imported content as text nodes, never interpolated HTML.
- API keys belong only in server environment. Bind the API server to localhost. Never expose or log secrets. Never call a paid provider automatically without configuration.
- LLM results require schema validation, one retry maximum, explicit errors and offline fallback. Never represent self-assessment as AI grading.
- Due dates use calendar-day operations, not fixed 24-hour arithmetic.
- Never infer production mastery from recognition. Level 5 requires two distinct confirmed unprompted writing sessions.

## UI standard

Use task-first design guidance from the available Sites workflow. Tom Pearl adopts Duolingo's focus on one task, readable hierarchy, tactile buttons, visible progress, immediate feedback and deliberate repetition. Use original pearl branding and original artwork. No hearts, XP or streaks.

Use semantic controls, visible keyboard focus, accessible labels, reduced-motion support and 360px responsive layouts. Maintain tokens and a coherent spacing scale. Controls must work; unavailable features must be identified honestly. Review desktop and mobile after visual changes.
