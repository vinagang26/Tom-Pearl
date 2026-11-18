export function normalize(text = '') {
    return String(text).normalize('NFKC').toLowerCase().replace(/[‐‑–—-]/g, ' ').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
}
export function forms(item) { return [...new Set([item.text, ...(item.forms || [])].map(normalize))].filter(Boolean); }
export function matches(answer, item) { return forms(item).includes(normalize(answer)); }
export function locate(text, item) {
    // Build a Unicode-aware boundary pattern, allowing whitespace and hyphens between words.
    for (const form of [item.text, ...(item.forms || [])].sort((a, b) => b.length - a.length)) {
        const pattern = normalize(form).split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-‐‑–—]+');
        const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + pattern + ')(?=$|[^\\p{L}\\p{N}])', 'iu');
        const m = re.exec(text.replace(/[’‘]/g, "'"));
        if (m)
            return { start: m.index + m[1].length, length: m[2].length };
    }
    return null;
}
export function contains(text, item) { return Boolean(locate(text, item)); }
export function gap(item) { const hit = locate(item.example || '', item); return hit ? item.example.slice(0, hit.start) + '____' + item.example.slice(hit.start + hit.length) : null; }
