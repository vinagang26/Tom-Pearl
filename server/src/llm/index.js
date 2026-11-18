import { validatedProvider } from './provider.js';
import { openaiProvider } from './openaiProvider.js';
import { anthropicProvider } from './anthropicProvider.js';
export function createProvider(config, onRequest) { if (!config.configured)
    return null; return validatedProvider(config.provider === 'openai' ? openaiProvider(config) : anthropicProvider(config), onRequest); }
