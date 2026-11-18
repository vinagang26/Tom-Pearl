import { h } from '../ui/dom.js';
import { shuffle, rng } from '../core/sessionBuilder.js';
import { meaning, changeReady } from './common.js';
export function generate(item, ctx) { const items = ctx.items.filter(i => ctx.task.itemIds.includes(i.id)); return { items, left: shuffle(items, rng(ctx.task.seed)), right: shuffle(items, rng(ctx.task.seed + 1)), title: 'Match the phrases to their meanings.', instruction: 'Choose a phrase, then its meaning. Find every pair.' }; }
export function render(task, container, onResult) {
    let left = null, right = null;
    const done = new Set(), mistakes = new Set();
    const grid = h('div', { class: 'matching-grid' }), a = h('div'), b = h('div');
    grid.append(a, b);
    container.append(grid);
    const leftButtons = new Map(), rightButtons = new Map();
    function pick(id, side) { if (done.has(id))
        return; if (side === 'left') {
        left = id;
        leftButtons.forEach((el, key) => el.classList.toggle('selected', key === id));
    }
    else {
        right = id;
        rightButtons.forEach((el, key) => el.classList.toggle('selected', key === id));
    } if (left && right) {
        if (left === right) {
            done.add(left);
            for (const el of [leftButtons.get(left), rightButtons.get(right)]) {
                el.disabled = true;
                el.classList.add('matched');
                el.classList.remove('selected');
            }
        }
        else {
            mistakes.add(left);
            mistakes.add(right);
            for (const el of [leftButtons.get(left), rightButtons.get(right)]) {
                el.classList.add('pair-mistake');
                setTimeout(() => el.classList.remove('pair-mistake'), 600);
            }
        }
        left = null;
        right = null;
        leftButtons.forEach(el => el.classList.remove('selected'));
        rightButtons.forEach(el => el.classList.remove('selected'));
        changeReady(container, done.size === task.items.length);
    } }
    task.left.forEach(i => { const el = h('button', { class: 'pair-button', onClick: () => pick(i.id, 'left') }, i.text); leftButtons.set(i.id, el); a.append(el); });
    task.right.forEach(i => { const el = h('button', { class: 'pair-button', onClick: () => pick(i.id, 'right') }, meaning(i)); rightButtons.set(i.id, el); b.append(el); });
    return { check() { if (done.size !== task.items.length)
            return; onResult(task.items.map(i => ({ itemId: i.id, correct: !mistakes.has(i.id), answer: i.text, comment: mistakes.has(i.id) ? 'A mismatched pair was counted. You will revisit this item.' : 'Pair matched without mistakes.' }))); } };
}
