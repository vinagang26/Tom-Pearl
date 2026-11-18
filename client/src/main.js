import { confirmAction } from './ui/components.js';
import { renderReview } from './screens/review.js';
import { renderParagraph } from './screens/paragraph.js';
import { api } from './api/client.js';
import { Item } from '../../shared/schemas.js';
import { h, icon, button } from './ui/dom.js';
import { load, save } from './storage/adapter.js';
import { seed } from './storage/seed.js';
import { stats } from './core/stats.js';
import { renderLibrary, renderImport, renderStats, renderSettings } from './screens/tools.js';
import { startSession } from './screens/session.js';
const root = document.querySelector('#app');
let data;
try {
    data = load() || { version: 2, items: seed.map(i => Item.parse(i)), progress: {}, writing: [], settings: { maxNew: 5, maxReview: 10 }, requestCount: 0 };
}
catch (e) {
    root.append(h('main', { class: 'startup-error' }, h('h1', {}, 'Your words are safe in a backup'), h('p', {}, e.message)));
    throw e;
}
let page = location.hash.slice(1) || 'learn';
export const app = {
    get data() { return data; },
    persist() { data = save(data); },
    replace(next, refresh = true) { data = save(next); if (refresh)
        render(); },
    update(change, refresh = true) { const next = structuredClone(data); change(next); this.replace(next, refresh); },
    async go(next) { if (this.activeWork && !await confirmAction('Leave this writing session without saving it?'))
        return; this.activeWork = false; this.cleanup?.(); this.cleanup = null; page = next; history.replaceState(null, '', '#' + next); render(); },
    toast(message) { const toast = h('div', { class: 'toast', role: 'status' }, message); document.body.append(toast); setTimeout(() => toast.remove(), 4500); },
    start(topic) { startSession(app, topic); }
};
function pearl() { return h('div', { class: 'pearl-mark', 'aria-hidden': 'true' }, h('span', {}), h('i', {}), h('b', {})); }
function nav() { return h('aside', { class: 'sidebar' }, h('a', { href: '#', class: 'brand', onClick: e => { e.preventDefault(); app.go('learn'); } }, pearl(), h('span', {}, 'tom pearl', h('small', {}, 'MAKE WORDS YOURS'))), h('nav', { 'aria-label': 'Main navigation' }, ...[['learn', 'Learn', 'learn'], ['library', 'My collection', 'library'], ['paragraph', 'Writing test', 'spark'], ['stats', 'Progress', 'stats']].map(([id, label, ico]) => h('button', { class: 'nav-item ' + (page === id ? 'active' : ''), onClick: () => app.go(id) }, icon(ico), label)), h('div', { class: 'nav-rule' }), h('button', { class: 'nav-item ' + (page === 'import' ? 'active' : ''), onClick: () => app.go('import') }, icon('plus'), 'Import words')), h('div', { class: 'sidebar-bottom' }, h('div', { class: 'offline-dot' }, 'Saved on this device'), h('button', { class: 'profile', onClick: () => app.go('settings') }, h('span', { class: 'avatar' }, 'Y'), h('span', {}, h('strong', {}, 'Your learning space'), h('small', {}, 'Settings & backups')), icon('settings')))); }
function shell(content) { root.replaceChildren(nav(), h('div', { class: 'workspace' }, h('header', { class: 'topbar' }, h('span', { class: 'breadcrumb' }, 'YOUR PERSONAL IELTS PRACTICE'), h('div', { class: 'course-pill' }, h('span', {}, 'EN'), 'English', h('span', { class: 'pill-divider' }), 'IELTS', button([icon('settings'), h('span', { class: 'sr-only' }, 'Open settings')], () => app.go('settings'), 'icon-button'))), content)); }
function home() {
    const s = stats(data.items, data.progress);
    const topics = [...new Set(data.items.map(i => i.topic))];
    const greeting = h('section', { class: 'greeting' }, h('div', {}, h('div', { class: 'eyebrow' }, 'A LITTLE PRACTICE. A LOT MORE CONFIDENCE.'), h('h1', {}, 'Find the words. ', h('span', {}, 'Make them yours.')), h('p', {}, 'From “I know this” to “I can use this.” One small lesson at a time.')));
    const summary = h('div', { class: 'quick-stats' }, ...[[s.newCount, 'ready to learn', 'spark'], [s.due, 'due for a refresh', 'learn'], [s.recall, 'recalled from memory', 'check']].map(([n, label, ico]) => h('div', { class: 'quick-stat' }, h('span', { class: 'stat-icon' }, icon(ico)), h('div', {}, h('strong', {}, n), h('span', {}, label)))));
    const hero = h('section', { class: 'lesson-hero' }, h('div', { class: 'hero-copy' }, h('span', { class: 'tag' }, 'YOUR NEXT SMALL WIN'), h('h2', {}, s.due ? 'Bring your words back.' : 'A thought, better expressed.'), h('p', {}, s.due ? 'A quick refresh helps your words stick. Let’s retrieve them again.' : 'Build useful phrases for the ideas you already have. Start with a short, mixed lesson.'), button(['Start a lesson', icon('arrow')], () => app.start()), h('div', { class: 'lesson-meta' }, data.settings.maxNew + ' new items', h('span', {}, '·'), 'Recognition → recall')), h('div', { class: 'hero-art', 'aria-hidden': 'true' }, h('span', { class: 'art-spark s1' }, '✦'), h('span', { class: 'art-spark s2' }, '✧'), h('div', { class: 'bubble b1' }, 'I understand it.'), h('div', { class: 'pearl-character' }, h('div', { class: 'character-face' }, h('i', {}), h('i', {}), h('span', {})), h('div', { class: 'character-cheek left' }), h('div', { class: 'character-cheek right' })), h('div', { class: 'bubble b2' }, 'I can use it!'), h('div', { class: 'art-shadow' })));
    const roadmap = h('section', { class: 'roadmap' }, h('div', { class: 'section-heading' }, h('div', {}, h('span', { class: 'eyebrow' }, 'STEP BY STEP'), h('h2', {}, 'Your learning path')), h('span', { class: 'muted' }, 'Confidence is built, not crammed.')), h('div', { class: 'path-strip' }, ...['Recognize', 'Build', 'Recall', 'Produce', 'Own it'].map((label, i) => h('div', { class: 'path-step ' + (i === 0 ? 'current' : '') }, h('div', { class: 'path-node' }, icon(i === 0 ? 'spark' : i < 3 ? 'learn' : 'check')), h('strong', {}, label), h('small', {}, ['Connect the meaning', 'Piece it together', 'Find it yourself', 'Use it naturally', 'Write it unprompted'][i])))), h('p', { class: 'path-note' }, 'Recognize it. Recall it. Use it naturally. Own it through unprompted writing.'));
    const collections = h('section', { class: 'collections' }, h('div', { class: 'section-heading' }, h('h2', {}, 'Words for your world'), h('div', { class: 'heading-actions' }, button('Writing test', () => app.go('paragraph'), 'text'), button('View collection', () => app.go('library'), 'text'))), h('div', { class: 'topic-grid' }, ...topics.map((topic, i) => { const count = data.items.filter(x => x.topic === topic).length; return h('button', { class: 'topic-card', onClick: () => app.start(topic) }, h('span', { class: 'topic-illustration tone-' + i % 4 }, ['◒', '♧', '✎', '⌘'][i % 4]), h('span', {}, h('strong', {}, topic), h('small', {}, count + ' items · practice collection')), icon('arrow')); })));
    const side = h('aside', { class: 'right-rail' }, h('section', { class: 'daily-card' }, h('div', { class: 'section-heading' }, h('h3', {}, 'A moment of focus'), h('span', { class: 'sun' }, '☀')), h('p', {}, 'You don’t need more words.', h('br'), 'You need words that show up.'), h('div', { class: 'focus-line' }), h('strong', {}, 'Today’s intention'), h('p', { class: 'muted' }, 'Recall one useful phrase without looking. Then use it in a sentence.')), h('section', { class: 'how-card' }, h('span', { class: 'eyebrow' }, 'THE TOM PEARL WAY'), h('h3', {}, 'Small lessons.', h('br'), 'Real expression.'), ...['Practice words you actually need', 'Retrieve, don’t just reread', 'Take your words into writing'].map((label, i) => h('div', { class: 'principle' }, h('span', {}, i + 1), label))), h('div', { class: 'local-note' }, icon('lock'), h('span', {}, 'Your collection stays in this browser.', h('br'), 'Export a backup in Settings.')));
    return h('main', { class: 'dashboard' }, greeting, h('div', { class: 'dashboard-grid' }, h('div', { class: 'main-column' }, summary, hero, roadmap, collections), side));
}
export function render() { try {
    shell(page === 'learn' ? home() : page === 'library' ? renderLibrary(app) : page === 'import' ? renderImport(app) : page === 'stats' ? renderStats(app) : page === 'paragraph' ? renderParagraph(app) : page === 'review' ? renderReview(app) : renderSettings(app));
}
catch (e) {
    app.toast(e.message);
} }
render();
api.health().then(() => { if (page === 'learn')
    render(); });
window.addEventListener('beforeunload', event => { if (app.activeWork) {
    event.preventDefault();
    event.returnValue = '';
} });
