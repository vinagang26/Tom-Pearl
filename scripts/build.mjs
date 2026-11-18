import { cp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let vite;
try {
    vite = await import('vite');
}
catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND')
        throw error;
}
if (vite) {
    await vite.build({ configFile: resolve(root, 'client/vite.config.js') });
}
else {
    // Native ES modules are also a valid distribution. This path needs no bundler.
    const out = resolve(root, 'dist');
    await rm(out, { recursive: true, force: true });
    await mkdir(out, { recursive: true });
    await cp(resolve(root, 'client/src'), resolve(out, 'src'), { recursive: true });
    await cp(resolve(root, 'shared'), resolve(out, 'shared'), { recursive: true });
    const zodRoot = dirname(fileURLToPath(import.meta.resolve('zod/package.json')));
    await cp(zodRoot, resolve(out, 'vendor/zod'), { recursive: true, filter: source => !source.endsWith('.ts') && !source.endsWith('.cts') });
    const map = '<script type="importmap">' + JSON.stringify({ imports: { zod: '/vendor/zod/index.js' } }) + '</script>';
    const html = (await readFile(resolve(root, 'client/index.html'), 'utf8')).replace('</head>', map + '</head>');
    await writeFile(resolve(out, 'index.html'), html);
    console.log('Built native ES-module distribution in dist/ (Vite unavailable).');
}
