# PIVD: evidence-first fixes

1. **Prove/reproduce:** record the exact trigger, expected result, actual result and environment. Preserve user data.
2. **Investigate:** trace the owning module and identify the root cause before editing. Check architecture boundaries.
3. **Verify:** add a meaningful regression check, implement a coherent fix, run relevant tests and build, and reproduce in-browser when available.
4. **Document:** record evidence, fix, actual verification and remaining uncertainty in STATE.md and changelog.md. Commit only completed work.
