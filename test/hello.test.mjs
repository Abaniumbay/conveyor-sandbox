import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../bin/hello.mjs', import.meta.url));

function run(args) {
  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8' });
}

test('greets the world when no name is supplied', () => {
  const result = run([]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, world!\n');
  assert.equal(result.stderr, '');
});

test('greets the supplied name', () => {
  const result = run(['Ada']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\n');
  assert.equal(result.stderr, '');
});

test('rejects more than one name with a usage message', () => {
  const result = run(['Ada', 'Grace']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: node bin\/hello\.mjs \[name\] \(at most one name accepted\)\n$/);
});
