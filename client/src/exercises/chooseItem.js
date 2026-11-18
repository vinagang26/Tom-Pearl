import { h } from '../ui/dom.js';
import { gap } from '../core/matcher.js';
import { shuffle, rng } from '../core/sessionBuilder.js';
import { changeReady } from './common.js';
export function generate(item, ctx) { return { item, title: item.kind === 'idiom' ? 'Which expression fits?' : 'Choose the missing phrase.', instruction: item.kind === 'idiom' ? item.scenarios[0] : gap(item), options: shuffle([item.text, ...item.distractors], rng(ctx.task.seed)) }; }
export function render(task, container, onResult) { let selected; const box = h('div', { class: 'answer-options' }); for (const option of task.options) {
    const el = h('button', { class: 'answer-option', onClick: () => { selected = option; box.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === el)); changeReady(container, true); } }, option);
    box.append(el);
} container.append(box); return { check() { if (selected)
        onResult([{ itemId: task.item.id, correct: selected === task.item.text, answer: selected }]); } }; }
