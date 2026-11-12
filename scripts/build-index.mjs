// tools/<id>.ts + tools/<id>.json  →  dist/index.json + dist/tools/<id>.ts
// The signature (dist/index.json.sig) covers index.json, which pins every file by sha256.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ID_RE = /^[a-z][a-z0-9-]*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const errors = [];
const tools = [];

const files = readdirSync(join(root, 'tools')).sort();
for (const f of files) {
  if (f.endsWith('.json')) {
    if (!files.includes(f.replace(/\.json$/, '.ts'))) errors.push(`${f}: no matching .ts file`);
    continue;
  }
  if (!f.endsWith('.ts')) {
    errors.push(`${f}: only <id>.ts and <id>.json belong in tools/`);
    continue;
  }
  const id = f.slice(0, -3);
  if (!ID_RE.test(id)) errors.push(`${f}: file name must be the tool id (a-z, 0-9, -)`);
  let meta;
  try {
    meta = JSON.parse(readFileSync(join(root, 'tools', `${id}.json`), 'utf8'));
  } catch (e) {
    errors.push(`${id}.json: ${e.code === 'ENOENT' ? 'missing' : e.message}`);
    continue;
  }
  if (!SEMVER_RE.test(meta.version ?? '')) errors.push(`${id}.json: "version" must be x.y.z`);
  if (typeof meta.summary?.en !== 'string' || typeof meta.summary?.tr !== 'string') errors.push(`${id}.json: "summary" needs en and tr`);
  const source = readFileSync(join(root, 'tools', f));
  const sha256 = createHash('sha256').update(source).digest('hex');
  tools.push({ id, version: meta.version, file: `tools/${f}`, sha256, bytes: source.length, summary: { en: meta.summary?.en, tr: meta.summary?.tr }, source });
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'tools'), { recursive: true });
for (const t of tools) writeFileSync(join(dist, t.file), t.source);
const index = { schema: 1, tools: tools.map(({ source: _, ...t }) => t) };
writeFileSync(join(dist, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`index.json: ${tools.length} tool(s) — ${tools.map((t) => `${t.id}@${t.version}`).join(', ')}`);
