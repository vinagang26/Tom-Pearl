import { h, button } from '../ui/dom.js';
import { heading, notice, labelled } from '../ui/components.js';
import { parseText } from '../core/parser.js';
import { api } from '../api/client.js';
export async function asBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(Error('Could not read ' + file.name)); reader.readAsDataURL(file); }); }
export function renderImport(app) {
    const textarea = h('textarea', { class: 'import-text', placeholder: '- arise from (v phr.): xuất phát từ\n- parental supervision: sự giám sát của cha mẹ', 'aria-label': 'Vocabulary notes' });
    const topic = h('input', { class: 'input', placeholder: 'Use AI topics, or enter your own', 'aria-label': 'Collection topic' });
    const document = h('input', { type: 'file', accept: '.txt,.md,.pdf,.docx', 'aria-label': 'Upload a document' });
    const images = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', multiple: '', 'aria-label': 'Upload screenshots' });
    const messages = h('div', { 'aria-live': 'polite' });
    const extract = button('Extract & review', async () => {
        extract.disabled = true;
        messages.replaceChildren(notice('Reading your material…'));
        try {
            let text = textarea.value;
            const file = document.files[0];
            if (file) {
                if (file.size > 7000000)
                    throw Error('Documents must be under 7 MB.');
                if (/\.(txt|md)$/i.test(file.name))
                    text += '\n' + await file.text();
                else {
                    const response = await fetch('/api/document', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, data: await asBase64(file) }), signal: AbortSignal.timeout(60000) });
                    const json = await response.json();
                    if (!response.ok)
                        throw Error(json.error || 'Document could not be read.');
                    text += '\n' + json.text;
                }
            }
            const files = [...images.files];
            if (files.length > 5 || files.some(f => f.size > 5000000))
                throw Error('Choose at most five images, each below 5 MB.');
            const encoded = await Promise.all(files.map(async (f) => ({ mediaType: f.type, data: await asBase64(f) })));
            let result = parseText(text), warnings = [];
            if ((result.leftover.length || encoded.length) && api.status.configured) {
                result = await api.extract({ text, images: encoded });
            }
            else if (encoded.length)
                warnings.push('Images were not extracted because no AI key is configured. Your parsed text is still available.');
            if (result.leftover?.length)
                warnings.push('Unparsed source (not saved): ' + result.leftover.join(' / '));
            if (!result.items.length)
                throw Error(warnings.join(' ') || 'No items found. Use one phrase: meaning per line, or configure AI extraction for screenshots and messy notes.');
            app.draft = { items: result.items.map(i => ({ ...i, topic: topic.value.trim() || i.topic || 'General', status: 'basic' })), source: text || files.map(f => f.name).join(', '), warnings };
            app.go('review');
        }
        catch (e) {
            messages.replaceChildren(notice(e.message));
        }
        finally {
            extract.disabled = false;
        }
    });
    return h('main', { class: 'tool-page' }, heading('START WITH WHAT YOU HAVE', 'Bring your words along.', 'Paste notes, drop in a document, or collect phrases from screenshots.'), notice(api.status.configured ? 'AI extraction is ready for screenshots and messy notes. You review all results before saving.' : 'Local mode: structured text import works without a key. Screenshots and messy extraction need a server-side AI key.'), h('section', { class: 'import-card' }, labelled('Collection topic (optional)', topic), labelled('Vocabulary notes', textarea), h('div', { class: 'upload-grid' }, labelled('Text, Markdown, PDF or Word document', document), labelled('Screenshots (up to five)', images)), extract), messages);
}
