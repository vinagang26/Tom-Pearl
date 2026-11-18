import { spawn } from 'node:child_process';
const jobs = [spawn(process.execPath, ['server/src/index.js'], { stdio: 'inherit' }), spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'client/vite.config.js'], { stdio: 'inherit' })];
let stopping = false;
function stop(code = 0) { if (stopping)
    return; stopping = true; for (const child of jobs)
    child.kill(); process.exitCode = code; }
for (const child of jobs) {
    child.on('error', () => stop(1));
    child.on('exit', code => stop(code || 0));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
