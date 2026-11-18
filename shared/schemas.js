import { z } from 'zod';
const text = z.string().trim().max(12000);
const strings = z.array(text).max(100);
export const Item = z.object({
    id: z.string().min(1), text: text.min(1), kind: z.enum(['collocation', 'idiom']), pos: text.default(''),
    meaningVi: text.default(''), meaningEn: text.default(''), forms: strings.default([]), example: text.default(''),
    distractors: strings.default([]), prompts: strings.default([]), scenarios: strings.default([]), topic: text.default('General'),
    function: z.enum(['cause', 'effect', 'contrast', 'example', 'evaluation', 'topic-noun', 'behaviour', 'other']).default('other'),
    template: text.default(''), status: z.enum(['basic', 'ready']), importId: text, createdAt: z.number().finite().nonnegative()
}).refine(i => Boolean(i.meaningVi || i.meaningEn), 'A meaning is required');
export const ExtractItem = z.object({ text: text.min(1), kind: z.enum(['collocation', 'idiom']).default('collocation'), pos: text.optional(), meaningVi: text.optional(), meaningEn: text.optional() });
export const ExtractResult = z.object({ items: z.array(ExtractItem).max(300) });
export const EnrichedItem = z.object({ text: text.min(1), kind: z.enum(['collocation', 'idiom']), pos: text.default(''), meaningVi: text.min(1), meaningEn: text.min(1), forms: strings, example: text.min(1), distractors: z.array(text.min(1)).length(3), prompts: z.array(text.min(1)).length(2), scenarios: strings, topic: text.min(1), function: z.enum(['cause', 'effect', 'contrast', 'example', 'evaluation', 'topic-noun', 'behaviour', 'other']), template: text.default('') });
export const EnrichResult = z.object({ items: z.array(EnrichedItem).max(15) });
export const SentenceGrade = z.object({ usesItemCorrectly: z.boolean(), grammarOk: z.boolean(), natural: z.boolean(), corrected: text, comment: text });
export const ParagraphGrade = z.object({ usage: z.record(z.string(), z.object({ found: z.boolean(), correctForm: z.boolean(), natural: z.boolean() })), feedback: text, suggestions: strings });
export const History = z.object({ ts: z.number().finite().nonnegative(), exerciseType: z.string(), correct: z.boolean(), responseMs: z.number().finite().nonnegative(), retry: z.boolean().default(false), sessionId: z.string().default('legacy') });
export const Progress = z.object({ itemId: z.string(), level: z.number().int().min(0).max(5), dueAt: z.number().finite().nonnegative(), timerTier: z.number().int().min(0).max(2), spontaneousSessionIds: z.array(z.string()), history: z.array(History) });
export const Writing = z.object({ id: z.string(), ts: z.number().finite().nonnegative(), topic: text, prompt: text, durationSec: z.number().positive(), text: text, wordCount: z.number().int().nonnegative(), eligibleIds: z.array(z.string()), usage: z.record(z.string(), z.enum(['unprompted', 'forced', 'checked', 'none'])), aiFeedback: ParagraphGrade.optional() });
export const Backup = z.object({ version: z.literal(2), items: z.array(Item).max(3000), progress: z.record(z.string(), Progress), writing: z.array(Writing).max(1000), settings: z.object({ maxNew: z.number().int().min(1).max(30), maxReview: z.number().int().min(1).max(30) }), requestCount: z.number().int().nonnegative().default(0) }).superRefine((d, ctx) => {
    const ids = new Set();
    for (const i of d.items) {
        if (ids.has(i.id))
            ctx.addIssue({ code: 'custom', message: 'Duplicate item IDs' });
        ids.add(i.id);
    }
    for (const [id, p] of Object.entries(d.progress))
        if (!ids.has(id) || p.itemId !== id)
            ctx.addIssue({ code: 'custom', message: 'Orphan progress' });
});
export const Images = z.array(z.object({ mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']), data: z.string().max(7500000).regex(/^[A-Za-z0-9+/]*={0,2}$/) })).max(5);
export const ExtractRequest = z.object({ text: z.string().max(100000).default(''), images: Images.default([]) });
export const EnrichRequest = z.object({ items: z.array(ExtractItem).min(1).max(300), regenerate: z.boolean().default(false) });
export const SentenceRequest = z.object({ item: Item, sentence: z.string().trim().min(1).max(4000) });
export const ParagraphRequest = z.object({ items: z.array(Item).max(100), text: z.string().trim().min(1).max(12000), prompt: text });
