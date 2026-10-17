import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../bin/hello.mjs', import.meta.url));

function run(args, lang, cwd) {
  const env = { ...process.env };
  if (lang === undefined) {
    delete env.LANG;
  } else {
    env.LANG = lang;
  }

  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', env, cwd });
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

test('repeats a supplied greeting the requested number of times', () => {
  const result = run(['--repeat', '3', 'Ada']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\nHello, Ada!\nHello, Ada!\n');
  assert.equal(result.stderr, '');
});

test('defaults repeat to one and accepts an explicit repeat count of one', () => {
  for (const args of [['Ada'], ['--repeat', '1', 'Ada']]) {
    const result = run(args);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, Ada!\n');
    assert.equal(result.stderr, '');
  }
});

test('rejects missing and invalid repeat counts without printing a greeting', () => {
  for (const args of [['--repeat'], ...['0', '-1', '1.5', 'abc'].map(value => ['--repeat', value])]) {
    const result = run(args);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'error: --repeat needs a whole number of at least 1\n');
  }
});

test('combines repeat with shout in either option order', () => {
  for (const args of [['--shout', '--repeat', '2', 'Ada'], ['--repeat', '2', '--shout', 'Ada']]) {
    const result = run(args);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'HELLO, ADA!\nHELLO, ADA!\n');
    assert.equal(result.stderr, '');
  }
});

test('repeats default, name-file, and Persian-locale greetings', () => {
  const defaultGreeting = run(['--repeat', '2'], 'fa');
  assert.equal(defaultGreeting.status, 0);
  assert.equal(defaultGreeting.stdout, 'سلام، دنیا!\nسلام، دنیا!\n');
  assert.equal(defaultGreeting.stderr, '');

  withNameFile(' Ada \nGrace\n', path => {
    const result = run(['--repeat', '2', '--name-file', path]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, Ada!\nHello, Ada!\n');
    assert.equal(result.stderr, '');
  });
});

test('keeps an option-shaped --name-file operand as its path', () => {
  const result = run(['--repeat', '2', '--name-file', '--shout']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Error: cannot read name file --shout: .+\n$/);
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

test('uses the locale default for empty and whitespace-only positional names', () => {
  for (const [lang, greeting] of [[undefined, 'Hello, world!'], ['fa', 'سلام، دنیا!']]) {
    for (const name of ['', ' \t ']) {
      for (const [args, expected] of [
        [[name], `${greeting}\n`],
        [['--shout', name], `${greeting.toUpperCase()}\n`],
      ]) {
        const result = run(args, lang);

        assert.equal(result.status, 0, `status for ${JSON.stringify(name)} with LANG=${lang ?? '(unset)'}`);
        assert.equal(result.stdout, expected, `stdout for ${JSON.stringify(name)} with LANG=${lang ?? '(unset)'}`);
        assert.equal(result.stderr, '', `stderr for ${JSON.stringify(name)} with LANG=${lang ?? '(unset)'}`);
      }
    }
  }
});

test('uses the locale default for empty and whitespace-only first lines from --name-file', () => {
  for (const [lang, greeting] of [[undefined, 'Hello, world!'], ['fa', 'سلام، دنیا!']]) {
    for (const contents of ['', ' \t \nIgnored\n']) {
      withNameFile(contents, path => {
        for (const [args, expected] of [
          [['--name-file', path], `${greeting}\n`],
          [['--shout', '--name-file', path], `${greeting.toUpperCase()}\n`],
        ]) {
          const result = run(args, lang);

          assert.equal(result.status, 0, `status for ${JSON.stringify(contents)} with LANG=${lang ?? '(unset)'}`);
          assert.equal(result.stdout, expected, `stdout for ${JSON.stringify(contents)} with LANG=${lang ?? '(unset)'}`);
          assert.equal(result.stderr, '', `stderr for ${JSON.stringify(contents)} with LANG=${lang ?? '(unset)'}`);
        }
      });
    }
  }
});

test('rejects more than one name with a usage message', () => {
  const result = run(['Ada', 'Grace']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Usage: node bin\/hello\.mjs \[name \| --name-file <path>\] \(at most one name source accepted\)\n$/);
});

test('rejects unknown long and short options before or after a name', () => {
  const usage = 'Usage: node bin/hello.mjs [name | --name-file <path>] (at most one name source accepted)\n';

  for (const args of [['--unknown'], ['--unknown', 'Ada'], ['Ada', '--unknown'], ['-z'], ['-z', 'Ada'], ['Ada', '-z']]) {
    const result = run(args);

    assert.equal(result.status, 2, `status for ${args.join(' ')}`);
    assert.equal(result.stdout, '', `stdout for ${args.join(' ')}`);
    assert.equal(result.stderr, usage, `stderr for ${args.join(' ')}`);
  }
});

test('treats a hyphen-prefixed name-file operand as a path', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hello-name-'));

  try {
    const result = run(['--name-file', '-z'], undefined, directory);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.startsWith('Error: cannot read name file -z: '));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('preserves --shout when it is consumed as the name-file path', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hello-name-'));

  try {
    writeFileSync(join(directory, '--shout'), 'Ada\n');

    const result = run(['--name-file', '--shout'], undefined, directory);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, Ada!\n');
    assert.equal(result.stderr, '');

    const shoutedResult = run(['--shout', '--name-file', '--shout'], undefined, directory);
    assert.equal(shoutedResult.status, 0);
    assert.equal(shoutedResult.stdout, 'HELLO, ADA!\n');
    assert.equal(shoutedResult.stderr, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
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

test('shouts the default and supplied English greetings in either argument order', () => {
  for (const [args, expected] of [
    [['--shout'], 'HELLO, WORLD!\n'],
    [['--shout', 'Ada'], 'HELLO, ADA!\n'],
    [['Ada', '--shout'], 'HELLO, ADA!\n'],
  ]) {
    const result = run(args);

    assert.equal(result.status, 0, `status for ${args.join(' ')}`);
    assert.equal(result.stdout, expected, `stdout for ${args.join(' ')}`);
    assert.equal(result.stderr, '', `stderr for ${args.join(' ')}`);
  }
});

test('shouts the selected Persian greeting without changing its punctuation', () => {
  for (const [args, expected] of [
    [['--shout'], 'سلام، دنیا!\n'],
    [['--shout', 'Ada'], 'سلام، ADA!\n'],
  ]) {
    const result = run(args, 'fa');

    assert.equal(result.status, 0, `status for ${args.join(' ')} with LANG=fa`);
    assert.equal(result.stdout, expected, `stdout for ${args.join(' ')} with LANG=fa`);
    assert.equal(result.stderr, '', `stderr for ${args.join(' ')} with LANG=fa`);
  }
});

test('shouts a name-file greeting and preserves name-file errors', () => {
  withNameFile('Ada\n', path => {
    const result = run(['--shout', '--name-file', path]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'HELLO, ADA!\n');
    assert.equal(result.stderr, '');
  });

  const path = join(tmpdir(), `missing-shouted-name-${process.pid}-${Date.now()}`);
  const regularResult = run(['--name-file', path]);
  const result = run(['--shout', '--name-file', path]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, regularResult.stderr);
});

test('shout does not change positional-name or unknown-option usage errors', () => {
  const usage = 'Usage: node bin/hello.mjs [name | --name-file <path>] (at most one name source accepted)\n';

  for (const args of [['--shout', 'Ada', 'Grace'], ['Ada', 'Grace', '--shout'], ['--shout', '--unknown']]) {
    const result = run(args);

    assert.equal(result.status, 2, `status for ${args.join(' ')}`);
    assert.equal(result.stdout, '', `stdout for ${args.join(' ')}`);
    assert.equal(result.stderr, usage, `stderr for ${args.join(' ')}`);
  }
});
