let status = { configured: false, provider: 'none', model: '', requestCount: 0, online: false };
export const api = { get status() { return status; }, async health() { try {
        status = { ...await request('/api/health'), online: true };
    }
    catch {
        status = { ...status, configured: false, online: false };
    } return status; }, extract: body => request('/api/extract', body), enrich: body => request('/api/enrich', body), gradeSentence: body => request('/api/grade-sentence', body), gradeParagraph: body => request('/api/grade-paragraph', body) };
async function request(path, body) { const response = await fetch(path, { ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(90000) }); let value; try {
    value = await response.json();
}
catch {
    throw Error('The local server returned an unreadable response.');
} if (!response.ok)
    throw Error(value.error || 'Request failed.'); if (Number.isInteger(value.requestCount))
    status.requestCount = value.requestCount; return value; }
