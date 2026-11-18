import { config } from '../config.js';
export function dueAt(level, now) { const date = new Date(now); date.setDate(date.getDate() + config.intervals[level]); return date.getTime(); }
export function isDue(progress, now) { return progress.level > 0 && progress.dueAt <= now; }
