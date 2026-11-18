import { h, button } from '../ui/dom.js';
import { heading, notice } from '../ui/components.js';
import { normalize } from '../core/matcher.js';
import { itemChecks } from '../core/itemChecks.js';
import { Item } from '../../../shared/schemas.js';
import { api } from '../api/client.js';
const listFields = new Set(['forms', 'distractors', 'prompts', 'scenarios']);
export function renderReview(app) {
    const draft = app.draft;
    if (!draft)
        return h('main', { class: 'tool-page' }, heading('NOTHING TO REVIEW', 'Bring some words first.', 'Start with notes or edit an item in your collection.'), button('Import words', () => app.go('import')));
    const rows = draft.items.map(raw => { const existing = raw.id ? app.data.items.find(i => i.id === raw.id) : app.data.items.find(i => normalize(i.text) === normalize(raw.text)); return { original: raw.text, item: { ...raw }, include: true, existing: existing?.id, mode: raw.id ? 'merge' : 'skip' }; });
    const table = h('table', { class: 'review-table' });
    const body = h('tbody');
    table.append(h('thead', {}, h('tr', {}, ...['Keep', 'Phrase & type', 'Meanings', 'Example & forms', 'Practice context', 'Topic & function', 'Actions'].map(t => h('th', { scope: 'col' }, t)))), body);
    const status = h('div', { 'aria-live': 'polite' });
    const saveButton = button('Save reviewed items', saveItems);
    const enrichButton = button('Enrich selected', () => enrich(rows.filter(r => r.include)), 'secondary');
    enrichButton.disabled = !api.status.configured;
    function renderRow(row) {
        const i = row.item;
        const badge = h('span', { class: 'validation-badge' });
        function validate() { const basic = itemChecks({ ...i, status: 'basic' }), full = itemChecks({ ...i, status: 'ready' }); badge.textContent = basic.length ? 'Needs a meaning / phrase' : full.length ? 'Basic · context incomplete' : 'Ready'; badge.title = full.join(' '); badge.className = 'validation-badge ' + (basic.length ? 'invalid' : full.length ? 'basic' : 'valid'); }
        function input(key, multi = false) { const value = listFields.has(key) ? (i[key] || []).join('\n') : i[key] || ''; const field = h(multi ? 'textarea' : 'input', { class: 'input', 'aria-label': key + ' for ' + row.original, value, ...(multi ? { rows: 3 } : {}), onInput: event => { i[key] = listFields.has(key) ? event.target.value.split('\n').map(v => v.trim()).filter(Boolean) : event.target.value; validate(); } }); if (multi)
            field.textContent = value; return h('label', {}, h('small', {}, key.replace(/([A-Z])/g, ' $1')), field); }
        const kind = h('select', { class: 'input', 'aria-label': 'Item kind', onChange: e => { i.kind = e.target.value; validate(); } }, ...['collocation', 'idiom'].map(v => h('option', { value: v, ...((i.kind || 'collocation') === v ? { selected: '' } : {}) }, v)));
        const tr = h('tr', {}, h('td', {}, h('input', { type: 'checkbox', checked: '', 'aria-label': 'Keep ' + row.original, onChange: e => row.include = e.target.checked })), h('td', {}, input('text'), kind, input('pos'), row.original !== i.text ? h('p', { class: 'source-change' }, 'Source: ' + row.original) : null, badge), h('td', {}, input('meaningVi', true), input('meaningEn', true)), h('td', {}, input('example', true), input('forms', true)), h('td', {}, input('distractors', true), input('prompts', true), input('scenarios', true), input('template', true)), h('td', {}, input('topic'), h('select', { class: 'input', 'aria-label': 'Expression function', onChange: e => i.function = e.target.value }, ...['cause', 'effect', 'contrast', 'example', 'evaluation', 'topic-noun', 'behaviour', 'other'].map(v => h('option', { value: v, ...((i.function || 'other') === v ? { selected: '' } : {}) }, v)))), h('td', {}, button('Regenerate', () => enrich([row]), 'text'), button('Delete', () => { row.include = false; tr.remove(); }, 'text')));
        if (row.existing)
            tr.lastChild.prepend(h('label', {}, h('small', {}, 'Existing item'), h('select', { class: 'input', 'aria-label': 'Duplicate handling', onChange: e => row.mode = e.target.value }, h('option', { value: 'skip', ...(row.mode === 'skip' ? { selected: '' } : {}) }, 'Skip duplicate'), h('option', { value: 'merge', ...(row.mode === 'merge' ? { selected: '' } : {}) }, 'Merge, keep progress'))));
        body.append(tr);
        validate();
    }
    rows.forEach(renderRow);
    async function enrich(selected) { if (!api.status.configured) {
        app.toast('Configure a server-side AI key in .env first.');
        return;
    } if (!selected.length)
        return; enrichButton.disabled = true; saveButton.disabled = true; status.replaceChildren(notice('Enriching in batches. Review the examples and distractors before accepting.')); try {
        const result = await api.enrich({ items: selected.map(r => ({ text: r.item.text, kind: r.item.kind || 'collocation', pos: r.item.pos || '', meaningVi: r.item.meaningVi || '', meaningEn: r.item.meaningEn || '' })), regenerate: selected.length === 1 });
        result.items.forEach((item, index) => selected[index].item = { ...selected[index].item, ...item, status: 'ready' });
        body.replaceChildren();
        rows.filter(r => r.include).forEach(renderRow);
        status.replaceChildren(notice('Enrichment ready. Check any changed wording and generated context.'));
    }
    catch (e) {
        status.replaceChildren(notice(e.message + ' You can still save basic items.'));
    }
    finally {
        enrichButton.disabled = false;
        saveButton.disabled = false;
    } }
    function saveItems() { try {
        const next = structuredClone(app.data);
        let added = 0;
        const importId = crypto.randomUUID();
        for (const row of rows) {
            if (!row.include)
                continue;
            if (row.existing && row.mode === 'skip')
                continue;
            const incoming = row.item; const previous = row.existing ? next.items.find(i => i.id === row.existing) : null; const raw = previous && !incoming.id ? {...previous, ...Object.fromEntries(Object.entries(incoming).filter(([key,value]) => value !== '' && (!Array.isArray(value) || value.length)))} : incoming;
            const base = { ...raw, id: row.existing || raw.id || crypto.randomUUID(), kind: raw.kind || 'collocation', importId: raw.importId || importId, createdAt: raw.createdAt || Date.now(), status: 'basic' };
            const ready = itemChecks({ ...base, status: 'ready' }).length === 0;
            base.status = ready ? 'ready' : 'basic';
            const item = Item.parse(base);
            const errors = itemChecks(item);
            if (errors.length)
                throw Error(errors.join(' '));
            const duplicate = next.items.find(i => normalize(i.text) === normalize(item.text) && i.id !== item.id);
            if (duplicate)
                throw Error('Duplicate phrase: ' + item.text + '. Skip it or merge into the existing item.');
            const at = next.items.findIndex(i => i.id === item.id);
            if (at >= 0)
                next.items[at] = item;
            else
                next.items.push(item);
            added++;
        }
        app.replace(next, false);
        app.draft = null;
        app.go('library');
        app.toast(added + ' items saved.');
    }
    catch (e) {
        status.replaceChildren(notice(e.name === 'ZodError' ? 'Each item needs a phrase, a meaning and valid fields.' : e.message));
    } }
    return h('main', { class: 'tool-page wide-page' }, heading('YOU HAVE THE FINAL SAY', 'Review your words.', 'Edit anything that feels off. Context lists use one entry per line. Incomplete context stays Basic.'), ...(draft.warnings || []).map(notice), h('details', { class: 'source-preview' }, h('summary', {}, 'Original source preview'), h('pre', {}, draft.source || '')), h('div', { class: 'toolbar' }, button('Accept all', () => { rows.forEach(r => r.include = true); body.replaceChildren(); rows.forEach(renderRow); }, 'secondary'), enrichButton, saveButton), status, h('div', { class: 'table-scroll' }, table));
}
