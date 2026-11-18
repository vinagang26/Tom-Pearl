import { ExtractRequest, ExtractResult, EnrichRequest, EnrichResult, SentenceRequest, SentenceGrade, ParagraphRequest, ParagraphGrade } from '../../shared/schemas.js';
import { parseText } from './parsing/heuristicParser.js';
import { itemChecks } from './validation/itemChecks.js';
import { normalize } from '../../client/src/core/matcher.js';
import * as prompts from './llm/prompts/index.js';
export function createService({ provider = null, cache = new Map(), persistCache = async () => { }, info = () => ({ configured: Boolean(provider), provider: 'none', model: '', requestCount: 0 }) } = {}) {
    function requireProvider() { if (!provider) {
        const e = Error('No AI key is configured. Use text import and basic practice, or add a server-side key in .env.');
        e.status = 503;
        throw e;
    } }
    return {
        health: () => info(),
        async extract(body) { const request = ExtractRequest.parse(body), result = parseText(request.text); if ((result.leftover.length || request.images.length) && provider) {
            const generated = await provider.generateJson({ system: prompts.extract, user: JSON.stringify({ text: result.leftover.join('\n') }), images: request.images, schema: ExtractResult });
            return { items: [...result.items, ...generated.items], leftover: [], aiUsed: true };
        } return { ...result, aiUsed: false, imageWarning: request.images.length ? 'Images need a configured AI provider. No images were extracted.' : null }; },
        async enrich(body) { requireProvider(); const request = EnrichRequest.parse(body), output = []; for (let start = 0; start < request.items.length; start += 15) {
            const batch = request.items.slice(start, start + 15);
            const missing = batch.filter(i => request.regenerate || !cache.has(normalize(i.text)));
            if (missing.length) {
                const enriched = await provider.generateJson({ system: prompts.enrich, user: JSON.stringify(missing), schema: EnrichResult, check: result => { if (result.items.length !== missing.length)
                        throw Error('AI omitted items.'); for (const item of result.items) {
                        const errors = itemChecks({ ...item, status: 'ready' });
                        if (errors.length)
                            throw Error(errors.join(' '));
                    } } });
                missing.forEach((item, index) => cache.set(normalize(item.text), enriched.items[index]));
                await persistCache(cache);
            }
            for (const item of batch)
                output.push(cache.get(normalize(item.text)));
        } return { items: output, ...info() }; },
        async gradeSentence(body) { requireProvider(); const request = SentenceRequest.parse(body); return provider.generateJson({ system: prompts.sentence, user: JSON.stringify(request), schema: SentenceGrade }); },
        async gradeParagraph(body) { requireProvider(); const request = ParagraphRequest.parse(body); return provider.generateJson({ system: prompts.paragraph, user: JSON.stringify(request), schema: ParagraphGrade, check: result => { const ids = request.items.map(i => i.id); if (Object.keys(result.usage).some(id => !ids.includes(id)) || ids.some(id => !result.usage[id]))
                throw Error('AI usage IDs do not match the request.'); } }); }
    };
}
