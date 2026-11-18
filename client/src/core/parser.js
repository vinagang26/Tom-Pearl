export function parseText(text) {
    const items = [], leftover = [];
    const lines = String(text).split(/\r?\n/);
    for (let n = 0; n < lines.length; n++) {
        const raw = lines[n];
        const line = raw.replace(/^\s*(?:[-•*▪–—]|\d+[.)])\s*/, '').trim();
        if (!line)
            continue;
        const m = line.match(/^(.+?)\s*(?:\(([^)]+)\))?\s*(?::|\t|\s[–—]\s)\s*(.+)$/);
        if (m) {
            items.push({ text: m[1].trim(), kind: 'collocation', pos: m[2] || '', meaningVi: m[3].trim(), meaningEn: '' });
            continue;
        }
        const label = line.match(/^(.+?)\s*\(([^)]+)\)\s*:?$/);
        const next = lines[n + 1]?.trim();
        if (label && next && !/^[-•*\d]/.test(next) && !next.includes(':')) {
            items.push({ text: label[1].trim(), kind: 'collocation', pos: label[2], meaningVi: next, meaningEn: '' });
            n++;
        }
        else
            leftover.push(raw);
    }
    return { items, leftover };
}
