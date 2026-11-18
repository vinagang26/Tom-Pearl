import { h, button } from '../ui/dom.js';
import { heading, notice, labelled, showDialog } from '../ui/components.js';
import { contains } from '../core/matcher.js';
import { recordWriting, freshProgress } from '../core/levels.js';
import { api } from '../api/client.js';
const prompts = { Society: 'How can communities help households facing financial pressure? Explain a cause and a practical response.', Environment: 'Discuss how everyday choices affect the planet. Explain one problem and a realistic solution.', Education: 'What helps young people prepare for adult life? Explain your reasoning with a specific example.', Technology: 'How has digital communication affected relationships? Discuss an advantage and a drawback.', General: 'Discuss a challenge that affects people today. Explain why it happens and suggest a practical response.' };
export function renderParagraph(app) {
    const root = h('main', { class: 'tool-page paragraph-page' });
    let timer = null, submitted = false;
    app.cleanup = () => clearInterval(timer);
    const topics = [...new Set(app.data.items.map(i => i.topic))];
    const topic = h('select', { class: 'input', 'aria-label': 'Writing topic' }, ...topics.map(t => h('option', { value: t }, t)));
    const duration = h('select', { class: 'input', 'aria-label': 'Writing duration' }, ...[5, 4, 3].map(n => h('option', { value: n * 60 }, n + ' minutes')));
    function setup() { root.replaceChildren(heading('RETRIEVAL, IN THE REAL WORLD', 'Let the words come to you.', 'Write a short paragraph from an idea. No word list, no hints. You will confirm which phrases came naturally.'), h('section', { class: 'settings-card' }, labelled('Topic', topic), labelled('Time limit', duration), notice('Only topic items at level 2 or above are eligible for the spontaneous-use metric. Only level-4 items can become Owned.'), button('Start writing', start))); }
    function start() {
        const chosen = topic.value, seconds = Number(duration.value), eligible = app.data.items.filter(i => i.topic === chosen && (app.data.progress[i.id]?.level || 0) >= 2).map(i => structuredClone(i));
        const prompt = prompts[chosen] || prompts.General;
        const id = crypto.randomUUID(), began = Date.now(), end = began + seconds * 1000;
        let wordCount = 0;
        const clock = h('span', { class: 'countdown', role: 'timer' }, format(seconds)), count = h('span', { class: 'muted' }, '0 words');
        const input = h('textarea', { class: 'paragraph-input', maxlength: 12000, 'aria-label': 'Your paragraph', placeholder: 'Begin with your own idea…', onInput: () => { wordCount = input.value.trim() ? input.value.trim().split(/\s+/).length : 0; count.textContent = wordCount + ' words'; } });
        const send = button('Finish & review', submit);
        root.replaceChildren(h('div', { class: 'section-heading' }, h('div', {}, h('div', { class: 'eyebrow' }, chosen.toUpperCase()), h('h1', {}, 'A thought, in your words.')), clock), h('div', { class: 'writing-prompt' }, prompt), input, h('div', { class: 'section-heading' }, count, send));
        input.focus();
        app.activeWork = true;
        timer = setInterval(() => { const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000)); clock.textContent = format(remaining); if (!remaining)
            submit(); }, 250);
        async function submit() {
            if (submitted)
                return;
            if (!input.value.trim()) {
                if (Date.now() >= end) {
                    clearInterval(timer);
                    app.activeWork = false;
                    app.toast('No paragraph was written, so no result was saved.');
                    setup();
                }
                else
                    app.toast('Write a paragraph before submitting.');
                return;
            }
            submitted = true;
            clearInterval(timer);
            input.disabled = true;
            send.disabled = true;
            const text = input.value;
            const durationSec = Math.min(seconds, Math.max(1, Math.round((Date.now() - began) / 1000)));
            const review = h('div', { 'aria-live': 'polite' }, notice(api.status.configured ? 'Checking expression usage…' : 'Detecting phrases locally. You will assess whether their usage was natural.'));
            root.append(review);
            let grade;
            try {
                if (api.status.configured)
                    grade = await api.gradeParagraph({ items: eligible, text, prompt });
            }
            catch (e) {
                review.replaceChildren(notice(e.message + ' Showing matcher-only detection.'));
            }
            const choices = {};
            const results = h('div', { class: 'usage-review' }, h('h2', {}, 'Which words showed up on their own?'), h('p', { class: 'muted' }, 'Unprompted = recalled without looking up the phrase and used naturally in the correct form. Forced = deliberately inserted. Checked = consulted notes or unsure about natural usage. Review every detection.'));
            if (grade)
                results.append(notice(grade.feedback), h('ul', {}, ...grade.suggestions.map(s => h('li', {}, s))));
            for (const item of eligible) {
                const found = contains(text, item);
                const judged = grade?.usage[item.id];
                choices[item.id] = found ? (!grade || (judged?.found && judged.correctForm && judged.natural) ? 'unprompted' : 'checked') : 'none';
                const select = h('select', { class: 'input', 'aria-label': 'Usage for ' + item.text, onChange: e => choices[item.id] = e.target.value }, ...['unprompted', 'forced', 'checked', 'none'].map(v => h('option', { value: v, ...(choices[item.id] === v ? { selected: '' } : {}), ...(v === 'unprompted' && !found ? { disabled: '' } : {}) }, ({ none: 'Not used', unprompted: 'Unprompted', forced: 'Forced', checked: 'Checked / uncertain' })[v])));
                results.append(h('div', { class: 'usage-row' }, h('div', {}, h('strong', {}, item.text), h('small', { class: 'muted' }, !found ? 'No accepted form detected.' : judged && !judged.natural ? 'AI flagged unnatural usage. Review before confirming.' : 'Accepted form detected.')), select));
            }
            if (!eligible.length)
                results.append(notice('No eligible items for this topic yet. Your paragraph can still be saved; spontaneous-use rate will be unavailable.'));
            const confirm = h('input', { type: 'checkbox' });
            const error = h('div', { 'aria-live': 'polite' });
            results.append(h('label', { class: 'rubric-row' }, confirm, 'I reviewed these labels and confirmed the naturalness of all unprompted uses.'), button('Save writing session', () => { if (!confirm.checked) {
                app.toast('Confirm your usage labels before saving.');
                return;
            } try {
                const next = structuredClone(app.data);
                const log = { id, ts: Date.now(), topic: chosen, prompt, durationSec, text, wordCount, eligibleIds: eligible.map(i => i.id), usage: choices, ...(grade ? { aiFeedback: grade } : {}) };
                next.writing.push(log);
                for (const item of eligible) {
                    next.progress[item.id] = recordWriting(next.progress[item.id] || freshProgress(item.id), id, choices[item.id], log.ts);
                }
                app.replace(next, false);
                app.activeWork = false;
                app.go('stats');
                app.toast('Writing saved. Only confirmed unprompted uses counted.');
            }
            catch (e) {
                error.replaceChildren(notice(e.message));
            } }), error);
            review.replaceChildren(results);
        }
    }
    setup();
    return root;
}
function format(seconds) { return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); }
export function showWriting(log) { showDialog('Writing · ' + new Date(log.ts).toLocaleDateString(), h('div', {}, h('p', { class: 'muted' }, log.topic + ' · ' + log.wordCount + ' words'), h('p', { class: 'writing-prompt' }, log.prompt), h('p', { class: 'saved-paragraph' }, log.text), log.aiFeedback ? notice(log.aiFeedback.feedback) : notice('Matcher-only review, confirmed by learner.'))); }
