// Signs dist/index.json with the ed25519 key in $KIT_TOOLS_SIGNING_KEY (PEM) → dist/index.json.sig (base64, 64 bytes).
// Refuses to sign with a key that doesn't match the public key embedded in Kotilo Kit.
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_KEY = 'Zc7nSVYZbog85y+JmWsFPhphr3vo4uJi/6ZTRokuFLk='; // raw 32 bytes, same as kotilo-kit
const pem = process.env.KIT_TOOLS_SIGNING_KEY;
if (!pem) {
  console.error('✗ KIT_TOOLS_SIGNING_KEY is not set');
  process.exit(1);
}
const dist = join(import.meta.dirname, '..', 'dist');
const data = readFileSync(join(dist, 'index.json'));
const sig = sign(null, data, createPrivateKey(pem));
const pub = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(PUBLIC_KEY, 'base64')]), format: 'der', type: 'spki' });
if (!verify(null, data, pub, sig)) {
  console.error('✗ the signing key does not match the public key embedded in Kotilo Kit');
  process.exit(1);
}
writeFileSync(join(dist, 'index.json.sig'), sig.toString('base64') + '\n');
console.log('index.json.sig written and verified');
