import { generate as typeGenerate, render } from './typeItem.js';
import { gap } from '../core/matcher.js';
export function generate(item, ctx) { return { ...typeGenerate(item, ctx), title: 'Complete the thought.', instruction: gap(item) }; }
export { render };
