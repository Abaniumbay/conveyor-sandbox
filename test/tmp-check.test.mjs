import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const script = join(repoRoot, 'scripts', 'tmp-check.sh');
const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

test('tmp-check.sh exits with status 0', () => {
  const result = spawnSync('sh', [script], { encoding: 'utf8' });
  assert.equal(result.status, 0);
});

test('tmp-check.sh prints success message starting with tmp ok:', () => {
  const result = spawnSync('sh', [script], { encoding: 'utf8' });
  assert.match(result.stdout, /^tmp ok: \/tmp\/tmp-check\./);
});

test('tmp-check.sh removes the file it created', () => {
  const result = spawnSync('sh', [script], { encoding: 'utf8' });
  const filepath = result.stdout.trim().replace(/^tmp ok: /, '');

  assert.ok(!existsSync(filepath), `File ${filepath} should not exist after script completes`);
});

test('README.md documents how to run the tmp-check script', () => {
  assert.match(readme, /## Checks/);
  assert.match(readme, /sh scripts\/tmp-check\.sh/);
});
