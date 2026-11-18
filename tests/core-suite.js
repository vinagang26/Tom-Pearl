import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { matches, contains, gap } from '../client/src/core/matcher.js';
import { parseText } from '../client/src/core/parser.js';
import { freshProgress, applyResult, recordWriting } from '../client/src/core/levels.js';
import { buildSession, requeue } from '../client/src/core/sessionBuilder.js';
import { itemChecks, available } from '../client/src/core/itemChecks.js';
import { stats } from '../client/src/core/stats.js';
import { validateImport } from '../client/src/storage/adapter.js';
import { seed } from '../client/src/storage/seed.js';
import { Item } from '../shared/schemas.js';
import { exercises } from '../client/src/exercises/index.js';
export function coreSuite(test){
const item = Item.parse(seed[0]);
const empty = () => ({ version: 2, items: seed.map(i => Item.parse(i)), progress: {}, writing: [], settings: { maxNew: 5, maxReview: 10 }, requestCount: 0 });
const answer = (p, extra = {}) => applyResult(p, { correct: true, exerciseType: 'typeItem', responseMs: 1000, now: 100, sessionId: 's', ...extra });
test('normalizes Unicode, hyphens, case, whitespace and inflected forms', () => { assert(matches('  ARISE—FROM ', item)); assert(contains('This arose from pressure.', item)); assert(!contains('surprise from pressure', item)); assert(!contains('arise fromage', item)); });
test('gap handles accepted inflections and preserves punctuation', () => { assert.equal(gap({ ...item, example: 'This arose from pressure.' }), 'This ____ pressure.'); assert.equal(gap({ ...item, example: 'Nothing relevant.' }), null); });
test('parser consumes all 17 messy fixture entries', async () => { const p = parseText(await readFile(new URL('../fixtures/sample-input.txt', import.meta.url), 'utf8')); assert.equal(p.items.length, 17); assert.equal(p.leftover.length, 0); assert.equal(p.items[0].text, 'negligence'); assert(p.items[5].meaningVi.includes('(gia đình')); });
test('parser supports bullets, tabs, dash separators, next-line meanings and leftover text', () => { const p = parseText('• rise (v): tăng\n2) fall\tgiảm\nword – nghĩa\nnegligence (n)\nsự thờ ơ\nmessy material'); assert.equal(p.items.length, 4); assert.deepEqual(p.leftover, ['messy material']); });
test('promotion never skips levels or mutates the input', () => { const p = freshProgress(item.id); assert.equal(answer(p).level, 1); assert.equal(p.level, 0); assert.equal(answer({ ...p, level: 3 }, { exerciseType: 'matchPairs' }).level, 3); });
test('failure floors, due now, frozen later stages and penalty-free retries', () => { assert.equal(answer({ ...freshProgress(item.id), level: 1 }, { correct: false }).level, 1); assert.equal(answer(freshProgress(item.id), { correct: false }).level, 0); const p = answer({ ...freshProgress(item.id), level: 3 }, { correct: false }); assert.equal(p.level, 2); assert.equal(p.dueAt, 100); assert.equal(answer(p, { retry: true }).level, 2); assert.equal(answer(p, { allowChange: false }).level, 2); });
test('sprint changes timer tier only, with clamping', () => { const p = { ...freshProgress(item.id), level: 4, timerTier: 2 }; assert.equal(answer(p, { exerciseType: 'timedSprint' }).timerTier, 2); assert.equal(answer(p, { exerciseType: 'timedSprint', correct: false }).level, 4); assert.equal(answer({ ...p, timerTier: 0 }, { exerciseType: 'timedSprint', correct: false }).timerTier, 0); });
test('spacing uses calendar-day operations', () => { const date = new Date(2026, 10, 1, 12), due = new Date(answer({ ...freshProgress(item.id), level: 2 }, { now: date.getTime() }).dueAt); assert.equal(due.getDate(), 4); assert.equal(due.getHours(), 12); });
test('Owned requires level4 and two distinct unprompted writing sessions', () => { const p = { ...freshProgress(item.id), level: 4 }, one = recordWriting(p, 'a', 'unprompted'); assert.equal(recordWriting(one, 'a', 'unprompted').level, 4); assert.equal(recordWriting(one, 'b', 'forced').level, 4); assert.equal(recordWriting(one, 'b', 'unprompted').level, 5); assert.equal(recordWriting({ ...p, level: 3 }, 'b', 'unprompted').spontaneousSessionIds.length, 0); });
test('session determinism, five-pair recognition and new-item cap', () => { const tasks = buildSession(seed, {}, { now: 0, seed: 12, maxNew: 5 }); assert.deepEqual(tasks, buildSession(seed, {}, { now: 0, seed: 12, maxNew: 5 })); assert.equal(tasks[0].itemIds.length, 5); assert(tasks.every(t => !['ownSentence', 'timedSprint'].includes(t.exerciseType))); assert.equal(new Set(tasks.flatMap(t => t.itemIds || [t.itemId])).size, 5); });
test('review cap, exclusion of future reviews and overdue priority', () => { const list = seed.slice(0, 3), p = Object.fromEntries(list.map((i, n) => [i.id, { ...freshProgress(i.id), level: 1, dueAt: n === 2 ? 999 : 20 - n }])); const tasks = buildSession(list, p, { now: 100, maxReview: 1 }); assert.equal(tasks.length, 1); assert.equal(tasks[0].itemId, list[1].id); });
test('context-aware review mapping, fallback and one retry only', () => { for (const [level, type] of [[1, 'buildItem'], [3, 'ownSentence'], [4, 'timedSprint'], [5, 'ownSentence']])
    assert.equal(buildSession([item], { [item.id]: { level, dueAt: 0 } }, { now: 1 })[0].exerciseType, type); assert.equal(buildSession([{ ...item, status: 'basic' }], { [item.id]: { level: 3, dueAt: 0 } }, { now: 1 })[0].exerciseType, 'typeItem'); const q = [{ id: '1', itemId: 'a', exerciseType: 'typeItem' }], next = requeue(q, q[0], ['a']); assert.equal(next.length, 2); assert.equal(requeue(next, next[1], ['a']).length, 2); });
test('validation rejects leaking prompts and answer distractors', () => { assert.equal(itemChecks(item).length, 0); assert(itemChecks({ ...item, prompts: ['arise from this', 'another idea'] }).length); assert(itemChecks({ ...item, distractors: [item.text, 'one', 'two'] }).length); assert(!available({ ...item, status: 'basic' }, 'ownSentence')); assert(!available({ ...item, text: 'word', example: '' }, 'buildItem')); });
test('all seven generators produce valid tasks, tiles and real gaps', () => { const ctx = { items: seed, task: { seed: 1, itemIds: [item.id] }, progress: {}, api: { status: { configured: false } } }; for (const [name, module] of Object.entries(exercises)) {
    const task = module.generate(item, ctx);
    assert(task.title, name);
    if (name === 'buildItem')
        for (const word of task.target.split(/\s+/))
            assert(task.tiles.some(t => t.word === word));
    if (name === 'gapType')
        assert(task.instruction.includes('____'));
} });
test('backup round trip, v1 migration, settings/orphan/context rejection', () => { const data = empty(); assert.deepEqual(validateImport(JSON.parse(JSON.stringify(data))), data); assert.equal(validateImport({ ...data, version: 1 }).version, 2); assert.throws(() => validateImport({ ...data, progress: { bad: freshProgress('bad') } })); assert.throws(() => validateImport({ ...data, settings: { maxNew: 999, maxReview: 5 } })); assert.throws(() => validateImport({ ...data, items: [{ ...item, example: 'Wrong example.' }] })); });
test('stats exclude retries and compute response medians and eligible denominators', () => { const p = freshProgress(item.id); p.history = [{ exerciseType: 'typeItem', correct: false, responseMs: 100, retry: false }, { exerciseType: 'typeItem', correct: true, responseMs: 10, retry: true }, { exerciseType: 'typeItem', correct: true, responseMs: 300, retry: false }]; const writing = Array.from({ length: 6 }, (_, n) => ({ eligibleIds: ['a', 'b'], usage: { a: 'unprompted', b: n ? 'none' : 'unprompted' } })); const s = stats([item], { [item.id]: p }, 0, writing); assert.equal(s.accuracy, 50); assert.equal(s.byType.typeItem.medianMs, 200); assert.equal(s.spontaneousRate, .5); assert.equal(stats([], {}, 0, []).spontaneousRate, null); });

test('Owned promotion applies its 21-day interval',()=>{const p={...freshProgress(item.id),level:4,spontaneousSessionIds:['one']};const now=new Date(2026,10,1,12).getTime();const owned=recordWriting(p,'two','unprompted',now);assert.equal(new Date(owned.dueAt).getDate(),22);});

}
