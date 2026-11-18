import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { allowedRequest, rateLimiter } from './middleware/security.js';
import { documentText } from './parsing/documentText.js';
const methods = { '/api/extract': 'extract', '/api/enrich': 'enrich', '/api/grade-sentence': 'gradeSentence', '/api/grade-paragraph': 'gradeParagraph' };
export async function dispatch(service, method, path, body) {
    if (method === 'GET' && path === '/api/health')
        return service.health();
    if (method === 'POST' && methods[path])
        return service[methods[path]](body);
    if (method === 'POST' && path === '/api/document')
        return { text: await documentText(body) };
    const error = Error('Unknown API route.');
    error.status = 404;
    throw error;
}
export function publicError(error) { return { status: error.type === 'entity.too.large' ? 413 : error.status || 400, error: error.name === 'ZodError' ? 'Invalid request. Check the supplied fields.' : error.code === 'ERR_MODULE_NOT_FOUND' ? 'A document parser is missing. Run npm install.' : error.message || 'Request failed.' }; }
export function createHttpServer({ service, port = 8173, directory }) {
    const accept = rateLimiter();
    return createServer(async (req, res) => {
        const json = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
        const host = req.headers.host?.split(':')[0] || '';
        if (!allowedRequest({ hostname: host, origin: req.headers.origin, port }))
            return json(403, { error: 'Origin or host not allowed.' });
        const path = new URL(req.url, 'http://localhost').pathname;
        if (path.startsWith('/api/')) {
            if (!accept(req.socket.remoteAddress))
                return json(429, { error: 'Too many requests. Wait a minute and try again.' });
            try {
                let text = '', size = 0;
                for await (const chunk of req) {
                    size += chunk.length;
                    if (size > 40 * 1024 * 1024) {
                        const e = Error('Upload exceeds 40 MB.');
                        e.status = 413;
                        throw e;
                    }
                    text += chunk;
                }
                const body = text ? JSON.parse(text) : {};
                const result = await dispatch(service, req.method, path, body);
                return json(200, { ...result, requestCount: service.health().requestCount });
            }
            catch (error) {
                const value = publicError(error);
                return json(value.status, { error: value.error });
            }
        }
        if (!['GET', 'HEAD'].includes(req.method))
            return json(405, { error: 'Method not allowed.' });
        try {
            const file = resolve(directory, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
            if (file !== directory && !file.startsWith(directory + sep))
                return json(403, { error: 'Forbidden.' });
            if (!(await stat(file)).isFile())
                return json(404, { error: 'Not found.' });
            const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
            res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
            res.end(req.method === 'HEAD' ? undefined : await readFile(file));
        }
        catch {
            return json(404, { error: 'Not found.' });
        }
    });
}
