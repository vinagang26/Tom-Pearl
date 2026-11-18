import assert from 'node:assert/strict';
import { z } from 'zod';
import { Item } from '../shared/schemas.js';
import { seed } from '../client/src/storage/seed.js';
import { createService } from '../server/src/service.js';
import { validatedProvider } from '../server/src/llm/provider.js';
import { openaiProvider } from '../server/src/llm/openaiProvider.js';
import { anthropicProvider } from '../server/src/llm/anthropicProvider.js';
import { configuration } from '../server/src/config.js';
import { documentText } from '../server/src/parsing/documentText.js';
import { allowedRequest, rateLimiter } from '../server/src/middleware/security.js';
import { dispatch, publicError, createHttpServer } from '../server/src/http.js';
import { once } from 'node:events';
export function serverSuite(test){
const item = Item.parse(seed[0]);
const enriched = { text: item.text, kind: item.kind, pos: 'v phr.', meaningVi: item.meaningVi, meaningEn: item.meaningEn, forms: item.forms, example: item.example, distractors: item.distractors, prompts: item.prompts, scenarios: [], topic: item.topic, function: item.function, template: '' };
test('provider validates JSON and retries exactly once', async () => { let calls = 0; const p = validatedProvider(async () => ++calls === 1 ? 'bad JSON' : '{"ok":true}'); assert.deepEqual(await p.generateJson({ schema: z.object({ ok: z.boolean() }), system: 'test', user: 'test' }), { ok: true }); assert.equal(calls, 2); });
test('provider reports invalid schema after second failure', async () => { let calls = 0; const p = validatedProvider(async () => { calls++; return '{}'; }); await assert.rejects(p.generateJson({ schema: z.object({ ok: z.boolean() }), system: 'test', user: 'test' }), /one retry/); assert.equal(calls, 2); });
test('semantic validation participates in retry', async () => { let calls = 0; const p = validatedProvider(async () => ({ ok: ++calls > 1 })); const v = await p.generateJson({ schema: z.object({ ok: z.boolean() }), system: 'test', user: 'test', check: v => { if (!v.ok)
        throw Error(); } }); assert(v.ok); });
test('no-key mode parses text, preserves leftovers and rejects AI routes', async () => { const s = createService(); const result = await s.extract({ text: 'arise from: xuất phát từ\nmessy line', images: [] }); assert.equal(result.items.length, 1); assert.equal(result.leftover.length, 1); await assert.rejects(s.enrich({ items: [{ text: 'arise from' }] }), /No AI key/); await assert.rejects(s.gradeSentence({}), /No AI key/); });
test('images without key produce a clear warning', async () => assert.match((await createService().extract({ images: [{ mediaType: 'image/png', data: 'YQ==' }] })).imageWarning, /No images were extracted/));
test('extraction sends only unparsed text to provider', async () => { let user; const s = createService({ provider: { generateJson: async (req) => { user = req.user; return { items: [{ text: 'word', kind: 'collocation' }] }; } } }); const r = await s.extract({ text: 'arise from: source\nmessy material', images: [] }); assert(!user.includes('arise from')); assert(user.includes('messy material')); assert.equal(r.items.length, 2); });
test('enrichment batches to 15 and caches normalized source text', async () => { const batches = []; const provider = { generateJson: async (req) => { const list = JSON.parse(req.user); batches.push(list.length); const result = { items: list.map(i => ({ ...enriched, text: i.text, example: 'This ' + i.text + ' pressure.', forms: [], prompts: ['Discuss causes.', 'Explain origins.'] })) }; req.check(result); return result; } }; const s = createService({ provider }); const inputs = Array.from({ length: 31 }, (_, n) => ({ text: 'phrase' + n, kind: 'collocation' })); const r = await s.enrich({ items: inputs }); assert.deepEqual(batches, [15, 15, 1]); assert.equal(r.items[30].text, 'phrase30'); await s.enrich({ items: [{ text: ' PHRASE0 ', kind: 'collocation' }] }); assert.equal(batches.length, 3); });
test('empty enrichment inputs and invalid route bodies are rejected', async () => { await assert.rejects(createService({ provider: {} }).enrich({ items: [] })); await assert.rejects(dispatch(createService(), 'POST', '/api/extract', { text: 123 })); await assert.rejects(dispatch(createService(), 'GET', '/api/unknown', {})); });
test('OpenAI image adapter retains key only in request authorization', async () => { let request; const send = openaiProvider({ key: 'fake-secret', model: 'test-model' }, async (url, req) => { request = JSON.parse(req.body); assert.equal(req.headers.Authorization, 'Bearer fake-secret'); return { ok: true, json: async () => ({ choices: [{ message: { content: '{}' } }] }) }; }); await send({ system: 's', user: 'u', schema: {}, images: [{ mediaType: 'image/png', data: 'YQ==' }] }); assert.equal(request.messages[1].content[1].image_url.url, 'data:image/png;base64,YQ=='); assert(!JSON.stringify(request).includes('fake-secret')); });
test('Anthropic adapter formats base64 content', async () => { let request; const send = anthropicProvider({ key: 'fake', model: 'model' }, async (url, req) => { request = JSON.parse(req.body); return { ok: true, json: async () => ({ content: [{ type: 'text', text: '{}' }] }) }; }); assert.equal(await send({ system: 's', user: 'u', schema: {}, images: [{ mediaType: 'image/png', data: 'YQ==' }] }), '{}'); assert.equal(request.messages[0].content[0].source.type, 'base64'); });
test('provider errors and configuration do not disclose secrets', async () => { const send = openaiProvider({ key: 'do-not-leak', model: 'model' }, async () => ({ ok: false, status: 401 })); await assert.rejects(send({ system: 's', user: 'u', schema: {} }), e => !e.message.includes('do-not-leak') && e.message.includes('401')); assert(!configuration({ OPENAI_API_KEY: 'fake' }).configured); assert(configuration({ LLM_MODEL: 'model', OPENAI_API_KEY: 'fake' }).configured); assert.throws(() => configuration({ LLM_PROVIDER: 'bad' })); });
test('document dispatch supports text, PDF and docx', async () => { assert.equal(await documentText({ name: 'a.md', data: Buffer.from('hello').toString('base64') }), 'hello'); assert.equal(await documentText({ name: 'a.pdf', data: 'YQ==' }, { pdf: async () => async () => ({ text: 'PDF words' }) }), 'PDF words'); assert.equal(await documentText({ name: 'a.docx', data: 'YQ==' }, { docx: async () => ({ extractRawText: async () => ({ value: 'Word text' }) }) }), 'Word text'); });
test('document failures explain scanned PDFs and invalid uploads', async () => { await assert.rejects(documentText({ name: 'a.pdf', data: 'YQ==' }, { pdf: async () => async () => ({ text: '' }) }), /screenshots/); await assert.rejects(documentText({ name: 'a.exe', data: 'YQ==' }), /txt/); await assert.rejects(documentText({ name: 'a.txt', data: 'not base64!' })); });
test('local security rejects foreign origins and DNS rebinding; rate cap expires', () => { assert(allowedRequest({ hostname: '127.0.0.1', origin: 'http://127.0.0.1:5173', port: 8173 })); assert(!allowedRequest({ hostname: 'evil.example', port: 8173 })); assert(!allowedRequest({ hostname: 'localhost', origin: 'https://evil.example', port: 8173 })); const accept = rateLimiter(2, 100); assert(accept('one', 1)); assert(accept('one', 2)); assert(!accept('one', 3)); assert(accept('one', 102)); });
test('HTTP server returns health, parses import and handles bad JSON and origin', async () => { const server = createHttpServer({ service: createService(), directory: new URL('../dist', import.meta.url).pathname, port: 8173 }); server.listen(0, '127.0.0.1'); await once(server, 'listening'); const base = 'http://127.0.0.1:' + server.address().port; try {
    assert.equal((await fetch(base + '/api/health')).status, 200);
    const result = await fetch(base + '/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'word: meaning' }) });
    assert.equal((await result.json()).items.length, 1);
    assert.equal((await fetch(base + '/api/extract', { method: 'POST', body: 'bad' })).status, 400);
    assert.equal((await fetch(base + '/api/health', { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await fetch(base + '/')).status, 200);
}
finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
} });

}
