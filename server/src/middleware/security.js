export function allowedRequest({ hostname, origin, port }) {
    const origins = [`http://127.0.0.1:${port}`, `http://localhost:${port}`, 'http://127.0.0.1:5173', 'http://localhost:5173'];
    return ['127.0.0.1', 'localhost'].includes(hostname.toLowerCase()) && (!origin || origins.includes(origin));
}
export function rateLimiter(limit = 40, windowMs = 60000) {
    const requests = new Map();
    return function accept(id, now = Date.now()) { const recent = (requests.get(id) || []).filter(ts => now - ts < windowMs); if (recent.length >= limit)
        return false; recent.push(now); requests.set(id, recent); return true; };
}
