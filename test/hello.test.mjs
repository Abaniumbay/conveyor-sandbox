import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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

function withNameFile(contents, callback) {
  const directory = mkdtempSync(join(tmpdir(), 'hello-name-'));
  const path = join(directory, 'name.txt');
  writeFileSync(path, contents);

  try {
    callback(path);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
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

test('greets the first line from --name-file', () => {
  withNameFile('Ada\nGrace\n', path => {
    const result = run(['--name-file', path]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, Ada!\n');
    assert.equal(result.stderr, '');
  });
});

test('trims the first line, ignores later lines, and accepts CRLF or no final terminator', () => {
  for (const contents of [' Ada \r\nGrace\n', 'Ada']) {
    withNameFile(contents, path => {
      const result = run(['--name-file', path]);

      assert.equal(result.status, 0);
      assert.equal(result.stdout, 'Hello, Ada!\n');
      assert.equal(result.stderr, '');
    });
  }
});

test('uses the selected locale for a file-sourced name', () => {
  withNameFile('Ada\n', path => {
    const result = run(['--name-file', path], 'fa');

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'سلام، Ada!\n');
    assert.equal(result.stderr, '');
  });
});

test('reports a file read failure with its path and does not greet', () => {
  const path = join(tmpdir(), `missing-name-${process.pid}-${Date.now()}`);

  for (const unreadablePath of [path, dirname(path)]) {
    const result = run(['--name-file', unreadablePath]);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.startsWith(`Error: cannot read name file ${unreadablePath}: `));
    assert.match(result.stderr, /: .+\n$/);
  }
});

test('rejects a missing name-file operand and two name sources', () => {
  withNameFile('Ada\n', path => {
    for (const args of [['--name-file'], ['--name-file', path, 'Grace'], ['Grace', '--name-file', path]]) {
      const result = run(args);

      assert.equal(result.status, 2);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /^Usage: node bin\/hello\.mjs /);
    }
  });
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
  assert.match(result.stderr, /^Usage: node bin\/hello\.mjs \[name \| --name-file <path>\] \(at most one name source accepted\)\n$/);
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
  assert.equal(result.stderr, 'Usage: node bin/hello.mjs [name | --name-file <path>] (at most one name source accepted)\n');
});
