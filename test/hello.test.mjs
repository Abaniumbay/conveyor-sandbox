import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../bin/hello.mjs', import.meta.url));

function run(args, lang) {
  const env = { ...process.env };
  if (lang === undefined) {
    delete env.LANG;
  } else {
    env.LANG = lang;
  }

  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', env });
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

test('trims surrounding whitespace from the supplied name', () => {
  const result = run(['  Ada Lovelace  ']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada Lovelace!\n');
  assert.equal(result.stderr, '');
});

test('rejects more than one name with a usage message', () => {
  const result = run(['Ada', 'Grace']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: node bin\/hello\.mjs \[name\] \(at most one name accepted\)\n$/);
});

test('uses English for unset, empty, English, and unsupported LANG values', () => {
  for (const lang of [undefined, '', 'en_US.UTF-8', 'xx_XX.UTF-8']) {
    for (const [args, expected] of [[[], 'Hello, world!\n'], [['Ada'], 'Hello, Ada!\n']]) {
      const result = run(args, lang);

      assert.equal(result.status, 0, `status for LANG=${lang ?? '(unset)'}`);
      assert.equal(result.stdout, expected, `stdout for LANG=${lang ?? '(unset)'}`);
      assert.equal(result.stderr, '', `stderr for LANG=${lang ?? '(unset)'}`);
    }
  }
});

test('uses Persian for fa and fa_IR.UTF-8 while preserving a supplied name', () => {
  for (const lang of ['fa', 'fa_IR.UTF-8']) {
    for (const [args, expected] of [[[], 'سلام، دنیا!\n'], [['Ada'], 'سلام، Ada!\n']]) {
      const result = run(args, lang);

      assert.equal(result.status, 0, `status for LANG=${lang}`);
      assert.equal(result.stdout, expected, `stdout for LANG=${lang}`);
      assert.equal(result.stderr, '', `stderr for LANG=${lang}`);
    }
  }
});

test('treats --lang fa as an extra argument even with Persian LANG', () => {
  const result = run(['--lang', 'fa'], 'fa');

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Usage: node bin/hello.mjs [name] (at most one name accepted)\n');
});
