import { h } from '../ui/dom.js';
import { shuffle, rng } from '../core/sessionBuilder.js';
import { normalize } from '../core/matcher.js';
import { meaning, changeReady } from './common.js';
export function generate(item, ctx) { const target = item.text.split(/\s+/).length === 1 ? item.example : item.text; const words = target.split(/\s+/); const foreign = ctx.items.filter(i => i.id !== item.id).flatMap(i => i.text.split(/\s+/)).filter(w => !words.includes(w)); const extra = [...new Set([...foreign, 'very', 'perhaps', 'often'].filter(w => !words.includes(w)))].slice(0, 2); return { item, target, title: words.length > item.text.split(/\s+/).length ? 'Build the example sentence.' : 'Put the words in order.', instruction: meaning(item), tiles: shuffle([...words, ...extra].map((word, id) => ({ word, id })), rng(ctx.task.seed)) }; }
export function render(task, container, onResult) { let selected = []; const tray = h('div', { class: 'tile-tray', 'aria-label': 'Your answer' }), pool = h('div', { class: 'tile-pool' }), buttons = new Map(); function update() { tray.replaceChildren(...selected.map(tile => h('button', { class: 'word-tile selected', onClick: () => { selected = selected.filter(s => s.id !== tile.id); buttons.get(tile.id).disabled = false; update(); } }, tile.word))); changeReady(container, selected.length > 0); } for (const tile of task.tiles) {
    const el = h('button', { class: 'word-tile', onClick: () => { selected.push(tile); el.disabled = true; update(); } }, tile.word);
    buttons.set(tile.id, el);
    pool.append(el);
} container.append(tray, pool); return { check() { const answer = selected.map(t => t.word).join(' '); onResult([{ itemId: task.item.id, correct: normalize(answer) === normalize(task.target), answer, correctAnswer: task.target }]); } }; }
