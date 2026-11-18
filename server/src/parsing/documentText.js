import { Buffer } from 'node:buffer';
export async function documentText({ name, data }, loaders = {}) { if (typeof name !== 'string' || typeof data !== 'string' || data.length > 10000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data))
    throw Error('Invalid document upload (maximum 7 MB).'); const bytes = Buffer.from(data, 'base64'); const ext = name.toLowerCase().split('.').at(-1); if (ext === 'txt' || ext === 'md')
    return bytes.toString('utf8'); if (ext === 'docx') {
    const module = loaders.docx ? await loaders.docx() : await import('mammoth');
    const mammoth = module.default || module;
    return (await mammoth.extractRawText({ buffer: bytes })).value;
} if (ext === 'pdf') {
    const parse = loaders.pdf ? await loaders.pdf() : (await import('pdf-parse/lib/pdf-parse.js')).default;
    const result = await parse(bytes, { max: 100 });
    if (!result.text?.trim())
        throw Error('This PDF has no readable text. Upload screenshots of the pages instead.');
    return result.text;
} throw Error('Use .txt, .md, .pdf or .docx.'); }
