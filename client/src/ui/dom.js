export function h(tag, attrs = {}, ...children) { const node = document.createElement(tag); for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on'))
        node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class')
        node.className = value;
    else if (value !== false && value != null)
        node.setAttribute(key, value);
} for (const c of children.flat(Infinity))
    if (c != null)
        node.append(c instanceof Node ? c : document.createTextNode(String(c))); return node; }
export function icon(name) { const paths = { learn: 'M4 5h6l2 2 2-2h6v14h-6l-2 2-2-2H4z M12 7v14', library: 'M4 4h5v16H4z M11 4h4v16h-4z M17 5l3-1 3 15-3 1z', stats: 'M5 20V12h3v8 M11 20V5h3v15 M17 20V9h3v11', settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z', arrow: 'M5 12h14 M13 6l6 6-6 6', check: 'M5 12l4 4L19 6', lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5z', spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z', plus: 'M12 5v14 M5 12h14', close: 'M6 6l12 12 M18 6L6 18' }; const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', paths[name] || paths.spark); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.8'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); svg.append(path); return svg; }
export function button(label, action, variant = 'primary') { return h('button', { class: 'button ' + variant, onClick: action }, label); }
