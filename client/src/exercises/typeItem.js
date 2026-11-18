import { matches } from '../core/matcher.js';
import { h } from '../ui/dom.js';
import { field, meaning } from './common.js';
export function generate(item, ctx) { const level = ctx.progress[item.id]?.level ?? 0; return { item, title: 'Find the English phrase.', instruction: meaning(item), hint: level === 2 ? item.text.split(/\s+/).map(w => w[0] + '…').join(' ') : '' }; }
export function render(task, container, onResult) { const input = field(container, { placeholder: 'Type the English phrase…' }); if (task.hint)
    container.append(h('p', { class: 'hint' }, 'First letters: ' + task.hint)); return { check() { if (input.value.trim())
        onResult([{ itemId: task.item.id, correct: matches(input.value, task.item), answer: input.value }]); } }; }
