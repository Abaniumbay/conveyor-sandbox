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

function run(args, lang = 'en_US.UTF-8') {
  return spawnSync(process.execPath, [command, ...args], {
    encoding: 'utf8',
    env: { ...process.env, LANG: lang },
  });
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

test('starts a named session with a greeting followed by its farewell', () => {
  const result = run(['session', 'Ada']);
  const farewell = run(['farewell', 'Ada']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\nGoodbye, Ada!\n');
  assert.equal(result.stdout.slice('Hello, Ada!\n'.length), farewell.stdout);
  assert.equal(result.stderr, '');
  assert.equal(farewell.status, 0);
});

test('starts an unnamed session with the default greeting and farewell', () => {
  const result = run(['session']);
  const farewell = run(['farewell']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, world!\nGoodbye!\n');
  assert.equal(result.stdout.slice('Hello, world!\n'.length), farewell.stdout);
  assert.equal(result.stderr, '');
  assert.equal(farewell.status, 0);
});

test('uses the Persian greeting for a named session when LANG is Persian', () => {
  const result = run(['session', 'Ada'], 'fa_IR.UTF-8');

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'سلام، Ada!\nGoodbye, Ada!\n');
  assert.equal(result.stderr, '');
});

test('rejects multiple session names with a usage message', () => {
  const result = run(['session', 'Ada', 'Grace']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: greet session \[name\]\n$/);
});

test('rejects an unknown subcommand with a usage message', () => {
  const result = run(['hello']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: greet farewell \[name\]\n$/);
});
