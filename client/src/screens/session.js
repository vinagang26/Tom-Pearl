import { confirmAction } from '../ui/components.js';
import { h, icon, button } from '../ui/dom.js';
import { buildSession, requeue } from '../core/sessionBuilder.js';
import { applyResult, freshProgress } from '../core/levels.js';
import { exercises } from '../exercises/index.js';
import { api } from '../api/client.js';
export function startSession(app, topic) {
    const items = app.data.items.filter(i => !topic || i.topic === topic);
    let queue = buildSession(items, app.data.progress, { ...app.data.settings, seed: Date.now() });
    if (!queue.length) {
        app.toast('All caught up. Add words or return when reviews are due.');
        return;
    }
    const sessionId = crypto.randomUUID(), started = Date.now(), initial = structuredClone(app.data.progress), failedItems = new Set(), reviewedItems = new Set(), results = [];
    let at = 0, controls = null, feedback = null, taskStart = 0, responseMs = 0, busy = false;
    const overlay = h('div', { class: 'session-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Practice lesson' });
    document.body.append(overlay);
    function close() { controls?.dispose?.(); overlay.remove(); app.go('learn'); }
    function show() {
        controls?.dispose?.();
        feedback = null;
        busy = false;
        responseMs = 0;
        const task = queue[at], item = app.data.items.find(i => i.id === task.itemId), exercise = exercises[task.exerciseType];
        const generated = exercise.generate(item, { items: app.data.items, progress: app.data.progress, task, api });
        taskStart = performance.now();
        const check = button('Check answer', checkAnswer);
        check.disabled = true;
        const footer = h('footer', { class: 'session-footer' }, h('span', { class: 'muted' }, task.retry ? 'A fresh try. No second penalty.' : 'Take a breath. Find the words.'), check);
        const content = h('div', { class: 'exercise-content', onReady: event => { if (!busy)
                check.disabled = !event.detail; } });
        const body = h('div', { class: 'exercise-body' }, h('div', { class: 'eyebrow' }, task.retry ? 'ONE MORE TRY' : task.exerciseType.replace(/([A-Z])/g, ' $1').toUpperCase()), h('h1', { tabindex: '-1' }, generated.title), h('p', { class: 'exercise-sub' }, generated.instruction), content);
        const bar = h('div', { class: 'session-progress' }, h('div', { style: 'width:' + Math.round(at / queue.length * 100) + '%' }));
        overlay.replaceChildren(h('div', { class: 'session-top' }, button([icon('close'), h('span', { class: 'sr-only' }, 'Exit lesson')], async () => { if (await confirmAction('Leave this lesson? Completed answers are saved.'))
            close(); }, 'icon-button'), bar, h('span', { class: 'task-count' }, (at + 1) + ' / ' + queue.length)), body, footer);
        controls = exercise.render(generated, content, receive);
        body.querySelector('h1').focus();
        if (['ownSentence', 'timedSprint'].includes(task.exerciseType))
            check.disabled = true;
        async function checkAnswer() { if (feedback) {
            advance();
            return;
        } if (check.disabled || busy)
            return; busy = true; responseMs = Math.round(performance.now() - taskStart); check.disabled = true; try {
            await controls.check();
        }
        catch (e) {
            app.toast(e.message);
            busy = false;
            check.disabled = false;
        } }
        function receive(answerResults) {
            if (feedback)
                return;
            feedback = answerResults;
            controls?.dispose?.();
            content.querySelectorAll('input,textarea,button').forEach(el => el.disabled = true);
            const passed = feedback.every(r => r.correct);
            footer.className = 'session-footer ' + (passed ? 'success' : 'failure');
            const details = h('div', {}, h('strong', {}, passed ? 'Nicely done!' : 'Let’s learn from this.'), ...feedback.map(r => { const target = app.data.items.find(i => i.id === r.itemId); return h('p', {}, r.correct ? target.text + ' · ' + (r.comment || 'Retrieved successfully.') : target.text + ' · ' + (r.correctAnswer || r.comment || target.meaningVi || target.meaningEn)); }));
            if (generated.item?.example)
                details.append(h('p', {}, 'Example: ' + generated.item.example));
            for (const r of feedback)
                if (r.grade?.corrected)
                    details.append(h('p', {}, 'Suggested sentence: ' + r.grade.corrected));
            if (feedback.length === 1 && !feedback[0].correct && ['ownSentence', 'timedSprint'].includes(task.exerciseType))
                details.append(button('Override: mark my sentence correct', () => { feedback[0].correct = true; feedback[0].comment = 'Verdict overridden by learner.'; footer.className = 'session-footer success'; app.toast('Override recorded. Continue to save it.'); }, 'text'));
            footer.replaceChildren(details, button('Continue', advance));
        }
        function advance() {
            if (!feedback)
                return;
            const elapsed = responseMs || Math.round(performance.now() - taskStart);
            const next = structuredClone(app.data);
            const failed = [];
            for (const r of feedback) {
                const p = next.progress[r.itemId] || freshProgress(r.itemId);
                const allowChange = task.isNew ? !failedItems.has(r.itemId) : !reviewedItems.has(r.itemId);
                next.progress[r.itemId] = applyResult(p, { correct: r.correct, exerciseType: task.exerciseType, responseMs: elapsed, sessionId, retry: !!task.retry, allowChange });
                if (!r.correct) {
                    failed.push(r.itemId);
                }
                results.push({ ...r, type: task.exerciseType, retry: !!task.retry });
            }
            try {
                app.replace(next, false);
            }
            catch (e) {
                app.toast(e.message);
                return;
            }
            for (const r of feedback) {
                if (!r.correct && !task.retry)
                    failedItems.add(r.itemId);
                if (!task.isNew)
                    reviewedItems.add(r.itemId);
            }
            queue = requeue(queue, task, failed);
            at++;
            if (at >= queue.length)
                summary();
            else
                show();
        }
        overlay.onkeydown = event => { if (event.key === 'Enter' && (!event.shiftKey || event.target.tagName !== 'TEXTAREA')) {
            event.preventDefault();
            if (feedback)
                advance();
            else
                checkAnswer();
        } };
    }
    function summary() {
        controls?.dispose?.();
        overlay.onkeydown = null;
        const first = results.filter(r => !r.retry);
        const accuracy = first.length ? Math.round(first.filter(r => r.correct).length / first.length * 100) : 0;
        const promoted = [], fallen = [];
        for (const i of items) {
            const before = initial[i.id]?.level || 0, after = app.data.progress[i.id]?.level || 0;
            if (after > before)
                promoted.push(i.text);
            if (after < before)
                fallen.push(i.text);
        }
        overlay.replaceChildren(h('div', { class: 'summary' }, h('div', { class: 'summary-pearl' }, '✦'), h('div', { class: 'eyebrow' }, 'A SMALL LESSON. A REAL STEP FORWARD.'), h('h1', {}, 'Look at you, finding the words.'), h('p', {}, 'Every retrieval makes the next one a little easier.'), h('div', { class: 'summary-stats' }, ...[[accuracy + '%', 'First-attempt accuracy'], [Math.max(1, Math.ceil((Date.now() - started) / 60000)) + ' min', 'Time well spent'], [promoted.length, 'Items promoted']].map(([n, label]) => h('div', {}, h('strong', {}, n), h('span', {}, label)))), ...Object.keys(exercises).map(type => { const r = first.filter(x => x.type === type); return r.length ? h('p', { class: 'breakdown' }, type + ': ' + r.filter(x => x.correct).length + ' / ' + r.length) : null; }), h('p', { class: 'breakdown' }, 'Promoted: ' + (promoted.join(', ') || 'None this session')), h('p', { class: 'breakdown' }, 'Moved back for practice: ' + (fallen.join(', ') || 'None')), button('Back to my path', close)));
    }
    show();
}
