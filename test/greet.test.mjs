import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../bin/greet.mjs', import.meta.url));

test('exposes greet as a package command', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.bin.greet, 'bin/greet.mjs');
});

function run(args) {
  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8' });
}

test('says farewell to a supplied name', () => {
  const result = run(['farewell', 'Ada']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Goodbye, Ada!\n');
  assert.equal(result.stderr, '');
});

test('says farewell without a name', () => {
  const result = run(['farewell']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Goodbye!\n');
  assert.equal(result.stderr, '');
});

test('rejects multiple names with a usage message', () => {
  const result = run(['farewell', 'Ada', 'Grace']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: greet farewell \[name\]\n$/);
});

test('rejects an unknown subcommand with a usage message', () => {
  const result = run(['hello']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: greet farewell \[name\]\n$/);
});
