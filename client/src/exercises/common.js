import { h } from '../ui/dom.js';
export function changeReady(container, value) { container.dispatchEvent(new CustomEvent('ready', { bubbles: true, detail: value })); }
export function field(container, { placeholder = 'Type your answer…', multiline = false } = {}) { const input = h(multiline ? 'textarea' : 'input', { class: multiline ? 'sentence-input' : 'recall-input', placeholder, 'aria-label': placeholder, autocomplete: 'off', onInput: () => changeReady(container, Boolean(input.value.trim())) }); container.append(input); setTimeout(() => input.focus(), 0); return input; }
export function meaning(item) { return item.meaningVi || item.meaningEn; }
