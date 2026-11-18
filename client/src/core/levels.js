import { dueAt } from './scheduler.js';
export function freshProgress(itemId) { return { itemId, level: 0, dueAt: 0, timerTier: 0, spontaneousSessionIds: [], history: [] }; }
export function applyResult(progress, { correct, exerciseType, responseMs, now = Date.now(), retry = false, sessionId = 'legacy', allowChange = true }) {
    const p = structuredClone(progress);
    p.history.push({ ts: now, exerciseType, correct, responseMs, retry, sessionId });
    if (retry || !allowChange)
        return p;
    if (exerciseType === 'timedSprint') {
        p.timerTier = Math.max(0, Math.min(2, p.timerTier + (correct ? 1 : -1)));
    }
    else if (correct) {
        const earned = { matchPairs: 1, chooseItem: 1, buildItem: 2, typeItem: 3, gapType: 3, ownSentence: 4 }[exerciseType] || 0;
        if (p.level < earned)
            p.level = Math.min(p.level + 1, earned);
    }
    else
        p.level = Math.max(progress.level > 0 ? 1 : 0, p.level - 1);
    p.dueAt = correct ? dueAt(p.level, now) : now;
    return p;
}
export function recordWriting(progress, sessionId, usage, now = Date.now()) {
 const p=structuredClone(progress);
 if(p.level>=4 && usage==='unprompted') {
  p.spontaneousSessionIds=[...new Set([...p.spontaneousSessionIds,sessionId])];
  if(p.spontaneousSessionIds.length>=2 && p.level<5) {p.level=5;p.dueAt=dueAt(5,now);}
 }
 return p;
}
