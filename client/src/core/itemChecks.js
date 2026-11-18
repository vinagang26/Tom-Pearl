import { contains, normalize, gap } from './matcher.js';
export function itemChecks(i) {
    const errors = [];
    if (!i.text?.trim())
        errors.push('Phrase is required.');
    if (!i.meaningVi?.trim() && !i.meaningEn?.trim())
        errors.push('A meaning is required.');
    if (i.status === 'ready') {
        if (!i.example || !contains(i.example, i))
            errors.push('Example must contain the phrase or an accepted form.');
        if (i.distractors?.length !== 3 || new Set(i.distractors.map(normalize)).size !== 3 || i.distractors.some(d => [i.text, ...(i.forms || [])].map(normalize).includes(normalize(d))))
            errors.push('Add three distinct distractors that differ from accepted answers.');
        if (i.prompts?.length !== 2 || i.prompts.some(p => !p.trim()))
            errors.push('Add two idea prompts.');
        const words = new Set(normalize(i.text).split(' '));
        if (i.prompts?.some(p => normalize(p).split(/[^\p{L}\p{N}']+/u).some(w => words.has(w))))
            errors.push('Idea prompts must not contain words from the phrase.');
        if (i.kind === 'idiom' && (i.scenarios?.length < 2 || !i.scenarios))
            errors.push('Idioms need two scenarios.');
    }
    return errors;
}
export function available(i, type) {
    const ready = i.status === 'ready' && itemChecks(i).length === 0;
    if (type === 'matchPairs' || type === 'typeItem')
        return Boolean(i.meaningVi || i.meaningEn);
    if (type === 'buildItem')
        return i.text.trim().split(/\s+/).length > 1 || Boolean(ready && i.example && contains(i.example, i));
    if (!ready)
        return false;
    if (type === 'chooseItem')
        return i.kind === 'idiom' ? i.scenarios?.length >= 2 : Boolean(gap(i));
    if (type === 'gapType')
        return Boolean(gap(i));
    return i.kind === 'idiom' ? i.scenarios?.length > 0 : i.prompts?.length > 0;
}
