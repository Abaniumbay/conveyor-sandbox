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

test('prints the package version with --version', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const result = run(['--version']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, `${packageJson.version}\n`);
  assert.equal(result.stderr, '');
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

test('starts an empty-name session with the default greeting and farewell', () => {
  for (const name of ['', '   ']) {
    const result = run(['session', name]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, world!\nGoodbye!\n');
    assert.equal(result.stderr, '');
  }
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

test('prints usage to stdout with --help and -h', () => {
  const help = run(['--help']);
  const short = run(['-h']);

  assert.equal(help.status, 0);
  assert.match(help.stdout, /^Usage: greet/);
  assert.equal(help.stderr, '');
  assert.equal(short.status, 0);
  assert.equal(short.stdout, help.stdout);
  assert.equal(short.stderr, '');
});

test('usage text has one line per supported option', () => {
  const lines = run(['--help']).stdout.split('\n');

  for (const option of ['--help, -h', '--version', 'farewell [name]', 'session [name]']) {
    assert.equal(lines.slice(1).filter((line) => line.trim().startsWith(option)).length, 1, option);
  }
});

test('unknown options print usage to stderr and exit 1', () => {
  const help = run(['--help']);
  for (const args of [['--bogus'], ['--repeat', '2', 'Ada'], ['-x']]) {
    const result = run(args);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, help.stdout);
  }
});

test('--version wins over other arguments, wherever it appears', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  for (const args of [['--version', 'farewell', 'Ada'], ['session', 'Ada', '--version'], ['farewell', '--version']]) {
    const result = run(args);
    assert.equal(result.status, 0, args.join(' '));
    assert.equal(result.stdout, `${packageJson.version}\n`);
    assert.equal(result.stderr, '');
  }
});

test('docs/reference.md lists the --version option', () => {
  const docs = readFileSync(new URL('../docs/reference.md', import.meta.url), 'utf8');

  assert.match(docs, /`greet`[^]*`--version`[^]*prints the package\s+version[^]*exits 0[^]*without greeting/);
});
