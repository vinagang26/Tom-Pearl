function median(values) { if (!values.length)
    return null; const s = [...values].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
export function stats(items, progress, now = Date.now(), writing = []) {
    const records = Object.values(progress), history = records.flatMap(p => p.history).filter(h => !h.retry);
    const byType = {};
    for (const type of [...new Set(history.map(h => h.exerciseType))]) {
        const h = history.filter(x => x.exerciseType === type);
        byType[type] = { attempts: h.length, accuracy: Math.round(h.filter(x => x.correct).length / h.length * 100), medianMs: median(h.map(x => x.responseMs)) };
    }
    const upcoming = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); const end = new Date(d); end.setDate(end.getDate() + 1); return { date: d.getTime(), count: records.filter(p => p.level > 0 && (i === 0 ? p.dueAt < end.getTime() : p.dueAt >= d.getTime() && p.dueAt < end.getTime())).length }; });
    const lastFive = writing.slice(-5);
    const eligible = lastFive.reduce((n, w) => n + w.eligibleIds.length, 0);
    const used = lastFive.reduce((n, w) => n + w.eligibleIds.filter(id => w.usage[id] === 'unprompted').length, 0);
    return { total: items.length, due: items.filter(i => progress[i.id]?.level > 0 && progress[i.id].dueAt <= now).length, newCount: items.filter(i => !progress[i.id]?.level).length, recall: records.filter(p => p.level >= 3).length, accuracy: history.length ? Math.round(history.filter(h => h.correct).length / history.length * 100) : null, attempts: history.length, byType, upcoming, spontaneousRate: eligible ? used / eligible : null };
}
