import { h, button } from '../ui/dom.js';
import { heading, notice, labelled, download, confirmAction } from '../ui/components.js';
import { validateImport, exportJson } from '../storage/adapter.js';
import { api } from '../api/client.js';
export function renderSettings(app) {
    const status = h('div');
    async function refresh() { await api.health(); status.replaceChildren(notice('Local API: ' + (api.status.online ? 'connected' : 'offline') + ' · AI: ' + (api.status.configured ? api.status.provider + ' / ' + api.status.model : 'not configured') + ' · LLM requests since server start: ' + api.status.requestCount)); }
    refresh();
    function number(key, label) { return labelled(label, h('input', { class: 'input', type: 'number', min: 1, max: 30, value: app.data.settings[key], onChange: e => { try {
            const value = Number(e.target.value);
            if (!Number.isInteger(value) || value < 1 || value > 30)
                throw Error('Choose a whole number from 1 to 30.');
            app.update(next => next.settings[key] = value, false);
        }
        catch (error) {
            e.target.value = app.data.settings[key];
            app.toast(error.message);
        } } })); }
    const restore = h('input', { type: 'file', accept: '.json', 'aria-label': 'Restore JSON backup', onChange: async (e) => { try {
            const file = e.target.files[0];
            if (!file)
                return;
            if (file.size > 5000000)
                throw Error('Backup must be smaller than 5 MB.');
            const next = validateImport(JSON.parse(await file.text()));
            if (await confirmAction('Replace the current collection and history? A backup of your current data will download first.')) {
                download('tom-pearl-before-restore.json', exportJson(app.data));
                app.replace(next);
                app.toast('Backup restored.');
            }
        }
        catch (error) {
            app.toast(error.name === 'ZodError' ? 'The backup failed schema validation. No data was changed.' : error.message);
        } e.target.value = ''; } });
    const pasted = h('textarea', { class: 'import-text', placeholder: 'Paste an exported Tom Pearl JSON backup here…', 'aria-label': 'Pasted JSON backup' });
    const pasteRestore = h('details', { class: 'paste-restore' }, h('summary', {}, 'Restore from pasted JSON'), pasted, button('Validate & restore pasted backup', async () => { try {
        const next = validateImport(JSON.parse(pasted.value));
        if (await confirmAction('Replace the current collection and history? A backup of your current data will download first.')) {
            download('tom-pearl-before-restore.json', exportJson(app.data));
            app.replace(next);
            app.toast('Backup restored.');
        }
    }
    catch (error) {
        app.toast(error.name === 'ZodError' ? 'The pasted backup failed validation. No data was changed.' : error.message);
    } }, 'secondary'));
    return h('main', { class: 'tool-page' }, heading('YOUR SPACE, YOUR PACE', 'Settings & backups', 'Choose a small session that fits your day. Keep a copy of what you learn.'), h('section', { class: 'settings-card' }, h('h2', {}, 'Session size'), number('maxNew', 'New items per session'), number('maxReview', 'Review items per session')), h('section', { class: 'settings-card' }, h('h2', {}, 'AI provider'), status, button('Refresh provider status', refresh, 'secondary'), h('p', { class: 'muted' }, 'Configure LLM_PROVIDER, LLM_MODEL and the matching API key in the server .env file, then restart the server. Keys never enter this browser. AI calls may incur provider charges; local practice is free.')), h('section', { class: 'settings-card' }, h('h2', {}, 'Keep a copy of your words'), notice('Progress stays in this browser. Export regularly, especially before clearing browser data.'), button('Export JSON backup', () => download('tom-pearl-backup.json', exportJson(app.data)), 'secondary'), labelled('Restore a validated backup', restore), pasteRestore), h('section', { class: 'settings-card' }, h('h2', {}, 'Start the ladder again'), h('p', { class: 'muted' }, 'Reset progress and writing history while keeping the vocabulary collection. A backup downloads before resetting.'), button('Reset learning progress', async () => { if (await confirmAction('Reset all learning progress and writing logs? Your words stay. A backup will download first.')) {
        download('tom-pearl-before-reset.json', exportJson(app.data));
        app.update(next => { next.progress = {}; next.writing = []; });
        app.toast('Progress reset. Your collection is still here.');
    } }, 'secondary')));
}
