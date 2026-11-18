export function configuration(env = process.env) { const provider = env.LLM_PROVIDER || 'openai'; if (!['openai', 'anthropic'].includes(provider))
    throw Error('LLM_PROVIDER must be openai or anthropic.'); const model = env.LLM_MODEL || ''; const key = provider === 'openai' ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY; const port = Number(env.PORT || 8173); if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw Error('PORT must be 1024–65535.'); return { provider, model, key: key || '', configured: Boolean(key && model && !model.includes('replace-with')), port }; }
