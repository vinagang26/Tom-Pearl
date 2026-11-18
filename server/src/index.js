import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { configuration } from './config.js';
import { createProvider } from './llm/index.js';
import { createService } from './service.js';
import { createHttpServer, dispatch, publicError } from './http.js';
import { allowedRequest, rateLimiter } from './middleware/security.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
try {
    process.loadEnvFile(resolve(root, '.env'));
}
catch (error) {
    if (error.code !== 'ENOENT')
        throw error;
}
const config = configuration();
let requestCount = 0, cache = new Map();
const cacheFile = resolve(root, '.cache/enrichment.json');
try {
    cache = new Map(JSON.parse(await readFile(cacheFile, 'utf8')));
}
catch { }
const info = () => ({ configured: config.configured, provider: config.provider, model: config.model, requestCount });
const service = createService({ provider: createProvider(config, () => requestCount++), cache, info, persistCache: async (value) => { await mkdir(resolve(root, '.cache'), { recursive: true }); await writeFile(cacheFile, JSON.stringify([...value])); } });
let express;
try {
    express = (await import('express')).default;
}
catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND')
        throw error;
}
let server;
if (express) {
    const app = express(), accept = rateLimiter();
    app.disable('x-powered-by');
    app.use((req, res, next) => { if (!allowedRequest({ hostname: req.hostname || '', origin: req.get('origin'), port: config.port }))
        return res.status(403).json({ error: 'Origin or host not allowed.' }); res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'no-referrer'); next(); });
    app.use(express.json({ limit: '40mb' }));
    app.use('/api', async (req, res) => { if (!accept(req.ip))
        return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' }); try {
        const value = await dispatch(service, req.method, '/api' + req.path, req.body);
        res.json({ ...value, requestCount });
    }
    catch (error) {
        const value = publicError(error);
        res.status(value.status).json({ error: value.error });
    } });
    app.use(express.static(resolve(root, 'dist')));
    app.use((error, req, res, next) => { const value = publicError(error); res.status(value.status).json({ error: value.error }); });
    server = app.listen(config.port, '127.0.0.1');
}
else
    server = createHttpServer({ service, port: config.port, directory: resolve(root, 'dist') }).listen(config.port, '127.0.0.1');
server.on('listening', () => console.log(`Tom Pearl · http://127.0.0.1:${config.port} · AI ${config.configured ? 'configured' : 'off (local mode)'}`));
server.on('error', error => { console.error('Could not start local server:', error.code); process.exitCode = 1; });
