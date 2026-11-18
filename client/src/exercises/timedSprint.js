import { render as sentenceRender, generate as sentenceGenerate } from './ownSentence.js';
import { h } from '../ui/dom.js';
import { config } from '../config.js';
export function generate(item, ctx) { return { ...sentenceGenerate(item, ctx), title: 'A thought against the clock.', seconds: config.timers[ctx.progress[item.id]?.timerTier || 0] }; }
export function render(task, container, onResult) { const end = Date.now() + task.seconds * 1000; let submitted = false; const timer = h('div', { class: 'countdown', role: 'timer' }, task.seconds + 's'); container.append(timer); const controls = sentenceRender(task, container, result => { clearInterval(tick); onResult(result); }); const tick = setInterval(() => { const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000)); timer.textContent = remaining + 's'; if (!remaining && !submitted) {
    submitted = true;
    clearInterval(tick);
    onResult([{ itemId: task.item.id, correct: false, answer: '', comment: 'Time ran out. You can revisit this phrase without pressure.' }]);
} }, 250); return { check() { if (submitted)
        return; submitted = true; clearInterval(tick); return controls.check(); }, dispose() { clearInterval(tick); controls.dispose?.(); } }; }
