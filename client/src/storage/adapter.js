import { Backup } from '../../../shared/schemas.js';
import { migrate } from './migrations.js';
import { itemChecks } from '../core/itemChecks.js';
const KEY = 'tom_pearl_v1';
export function validateImport(data) { const result = Backup.parse(migrate(data)); for (const item of result.items) {
    const errors = itemChecks(item);
    if (errors.length)
        throw Error(item.text + ': ' + errors.join(' '));
} return result; }
export function load() { const raw = localStorage.getItem(KEY); if (!raw)
    return null; try {
    return validateImport(JSON.parse(raw));
}
catch {
    localStorage.setItem(KEY + '_backup_' + Date.now(), raw);
    throw Error('Saved data could not be opened. Its original text was preserved in a backup.');
} }
export function save(data) { const value = validateImport(data); try {
    localStorage.setItem(KEY, JSON.stringify(value));
}
catch {
    throw Error('Browser storage is full. Export a backup before leaving.');
} return value; }
export function recoverEmpty(data) { save(data); return data; }
export function exportJson(data) { return JSON.stringify(validateImport(data), null, 2); }
