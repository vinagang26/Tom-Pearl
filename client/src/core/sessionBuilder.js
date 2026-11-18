import { config } from '../config.js';
import { available } from './itemChecks.js';
export function rng(seed = 1) { let n = seed >>> 0; return () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296); }
export function shuffle(values, random = rng()) { const a = [...values]; for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
export function buildSession(items, progress, { now = Date.now(), seed = 1, maxNew = config.maxNew, maxReview = config.maxReview } = {}) {
    const random = rng(seed), tasks = [];
    const reviews = items.filter(i => progress[i.id]?.level > 0 && progress[i.id].dueAt <= now).sort((a, b) => progress[a.id].dueAt - progress[b.id].dueAt || progress[a.id].level - progress[b.id].level).slice(0, maxReview);
    for (const i of reviews) {
        const level = progress[i.id].level;
        let wanted = level === 1 ? 'buildItem' : level === 2 ? (random() < .5 ? 'gapType' : 'typeItem') : level === 3 ? 'ownSentence' : level === 4 ? 'timedSprint' : 'ownSentence';
        if (!available(i, wanted))
            wanted = level < 2 && available(i, 'buildItem') ? 'buildItem' : 'typeItem';
        tasks.push({ itemId: i.id, exerciseType: wanted, isNew: false });
    }
    const fresh = items.filter(i => !progress[i.id]?.level);
    const topic = fresh[0]?.topic;
    const selected = [...fresh.filter(i => i.topic === topic), ...fresh.filter(i => i.topic !== topic)].slice(0, maxNew);
    for (const type of ['matchPairs', 'buildItem', 'typeItem'])
        for (const i of selected)
            if (available(i, type))
                tasks.push({ itemId: i.id, exerciseType: type, isNew: true });
    for (const i of selected)
        if (available(i, 'chooseItem'))
            tasks.push({ itemId: i.id, exerciseType: 'chooseItem', isNew: true });
    const ranks = { matchPairs: 0, chooseItem: 0, buildItem: 1, typeItem: 2, gapType: 2, ownSentence: 3, timedSprint: 4 };
    tasks.sort((a, b) => ranks[a.exerciseType] - ranks[b.exerciseType]);
    // Recognition is one round of up to five pairs, not five repeated choice screens.
    const packed = [];
    for (const task of tasks) {
        const last = packed.at(-1);
        if (task.exerciseType === 'matchPairs' && last?.exerciseType === 'matchPairs' && last.itemIds.length < 5)
            last.itemIds.push(task.itemId);
        else
            packed.push(task.exerciseType === 'matchPairs' ? { ...task, itemIds: [task.itemId] } : task);
    }
    return packed.map((t, index) => ({ ...t, id: 'task-' + index, seed: Math.floor(random() * 1e9) }));
}
export function requeue(queue, task, failedIds) { if (task.retry || !failedIds.length)
    return queue; return [...queue, { ...task, id: task.id + '-retry', retry: true, ...(task.itemIds ? { itemIds: failedIds, itemId: failedIds[0] } : {}) }]; }
