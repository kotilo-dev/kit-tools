// A published version must never be re-signed with different bytes: a changed tool needs a higher version.
// Compares dist/index.json (run build-index first) with the live index on kotilo.dev.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LIVE = 'https://kotilo.dev/kit-tools/index.json';
const local = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'dist', 'index.json'), 'utf8')).tools;
const res = await fetch(LIVE, { cache: 'no-store' });
if (res.status === 404) {
  console.log('no published index yet');
  process.exit(0);
}
if (!res.ok) throw new Error(`${LIVE}: HTTP ${res.status}`);
const live = new Map((await res.json()).tools.map((t) => [t.id, t]));

const cmp = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};
const errors = [];
for (const t of local) {
  const p = live.get(t.id);
  if (!p) continue;
  const c = cmp(t.version, p.version);
  if (c < 0) errors.push(`${t.id}: version ${t.version} is lower than the published ${p.version}`);
  else if (c === 0 && t.sha256 !== p.sha256) errors.push(`${t.id}: tools/${t.id}.ts changed but version is still ${t.version} — bump it in tools/${t.id}.json`);
}
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`versions ok (${local.length} tool(s))`);
