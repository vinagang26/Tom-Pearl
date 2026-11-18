import { Item } from '../../../shared/schemas.js';
export function migrate(data) { if (data.version === 2)
    return data; if (data.version !== 1)
    throw Error('This backup version is not supported.'); return { ...data, version: 2, items: data.items.map(i => Item.parse({ ...i, status: i.status || 'basic', kind: i.kind || 'collocation', importId: i.importId || 'legacy', createdAt: i.createdAt || 0 })), writing: data.writing || [], requestCount: 0 }; }
