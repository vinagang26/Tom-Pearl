import { h, button } from '../ui/dom.js';
import { field } from './common.js';
import { contains } from '../core/matcher.js';
import { rubric, passedGrade } from '../core/rubric.js';
export function generate(item, ctx) { return { item, title: 'Make the phrase your own.', instruction: item.kind === 'idiom' ? item.scenarios[0] : item.prompts[0], api: ctx.api }; }
export function render(task, container, onResult) {
    let busy = false, cancelled = false;
    container.append(h('p', { class: 'target-phrase' }, 'Use: ', h('strong', {}, task.item.text)));
    const input = field(container, { placeholder: 'Write one natural sentence…', multiline: true });
    const status = h('div', { 'aria-live': 'polite' });
    container.append(status);
    function fallback(message) { status.replaceChildren(h('p', { class: 'notice' }, message + ' Assess your sentence honestly. This is self-assessment, not an AI grade.')); const checks = rubric.map(label => { const box = h('input', { type: 'checkbox' }); status.append(h('label', { class: 'rubric-row' }, box, label)); return box; }); status.append(button('Confirm my assessment', () => { if (cancelled)
        return; onResult([{ itemId: task.item.id, correct: checks.every(c => c.checked), answer: input.value, comment: 'Self-assessed using the three criteria.', selfAssessed: true }]); })); }
    return { async check() { if (busy || !input.value.trim())
            return; if (!contains(input.value, task.item)) {
            onResult([{ itemId: task.item.id, correct: false, answer: input.value, comment: 'Include the target expression or one of its accepted forms.' }]);
            return;
        } busy = true; input.disabled = true; if (!task.api.status.configured) {
            fallback('AI is not configured.');
            return;
        } status.replaceChildren(h('p', { class: 'muted' }, 'Checking usage, grammar and naturalness…')); try {
            const grade = await task.api.gradeSentence({ item: task.item, sentence: input.value });
            if (!cancelled)
                onResult([{ itemId: task.item.id, correct: passedGrade(grade), answer: input.value, grade, comment: grade.comment }]);
        }
        catch (e) {
            if (!cancelled)
                fallback(e.message);
        } }, dispose() { cancelled = true; } };
}
