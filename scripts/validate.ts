// Loads every tools/*.ts in Kotilo Kit's real plugin sandbox and checks its examples.
// Run from a kotilo-kit checkout (CI: .kit/) so the loader is exactly what the app ships:
//   KIT_DIR=.kit .kit/node_modules/.bin/tsx --import ./.kit/apps/cli/raw-hook.mjs scripts/validate.ts
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const kitDir = resolve(process.env.KIT_DIR ?? '.kit');
const core = (await import(pathToFileURL(join(kitDir, 'packages/kit-core/src/index.ts')).href)) as typeof import('../.kit/packages/kit-core/src/index.js');

const toolsDir = join(import.meta.dirname, '..', 'tools');
const files = readdirSync(toolsDir).filter((f) => f.endsWith('.ts'));
const set = await core.loadPlugins(files.map((f) => ({ file: join(toolsDir, f), source: readFileSync(join(toolsDir, f), 'utf8') })));

let failed = 0;
for (const p of set.plugins) {
  const name = p.display;
  if (p.error) {
    failed++;
    console.error(`✗ ${name}: ${p.error.code} ${JSON.stringify(p.error.params)}${p.error.loc ? ` at ${p.error.loc}` : ''}`);
    continue;
  }
  const id = name.replace(/^tools\//, '').replace(/\.ts$/, '');
  const tool = set.tools.find((t) => t.id === id);
  if (!tool) {
    failed++;
    console.error(`✗ ${name}: the tool id must match the file name ("${id}")`);
    continue;
  }
  if (!tool.examples?.length) {
    failed++;
    console.error(`✗ ${name}: add at least one example { input, output }`);
    continue;
  }
  for (const ex of tool.examples) {
    for (const locale of ['en', 'tr'] as const) {
      const out = core.runTool(tool, ex.input, undefined, { locale, now: new Date('2026-01-01T00:00:00Z') }).output;
      if (out !== ex.output) {
        failed++;
        console.error(`✗ ${name} [${locale}]: ${JSON.stringify(ex.input)} → ${JSON.stringify(out)}, expected ${JSON.stringify(ex.output)}`);
      }
    }
  }
  if (!failed) console.log(`✓ ${name} (${tool.examples.length} example(s))`);
}
set.dispose();
process.exit(failed ? 1 : 0);
