import assert from 'node:assert/strict';
import { mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../bin/hello.mjs', import.meta.url));
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const reference = readFileSync(new URL('../docs/reference.md', import.meta.url), 'utf8');

function run(args, lang, cwd, forceTty) {
  const env = { ...process.env };
  if (lang === undefined) {
    delete env.LANG;
  } else {
    env.LANG = lang;
  }
  if (forceTty) {
    env.FORCE_TTY = '1';
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

test('prefixes the selected greeting before or after a positional name', () => {
  for (const [args, expected] of [
    [['--prefix', 'Hey', 'Ada'], 'Hey Hello, Ada!\n'],
    [['Ada', '--prefix', 'Hey'], 'Hey Hello, Ada!\n'],
    [['--prefix', 'Hey'], 'Hey Hello, world!\n'],
  ]) {
    const result = run(args);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
    assert.equal(result.stderr, '');
  }
});

test('rejects a missing prefix value without printing a greeting', () => {
  const result = run(['--prefix']);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'error: --prefix needs a value\n');
});

test('prefixes each selected greeting without transforming the prefix', () => {
  for (const [args, lang, expected] of [
    [['--prefix', 'Hey', '--repeat', '2', 'Ada'], undefined, 'Hey Hello, Ada!\nHey Hello, Ada!\n'],
    [['--prefix', 'Hey', '--shout', 'Ada'], undefined, 'Hey HELLO, ADA!\n'],
    [['--prefix', 'Hey', '--lowercase', 'Ada'], undefined, 'Hey hello, ada!\n'],
    [['--prefix', 'Hey'], 'fa', 'Hey سلام، دنیا!\n'],
  ]) {
    const result = run(args, lang);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
    assert.equal(result.stderr, '');
  }

  withNameFile('Ada\n', path => {
    const result = run(['--prefix', 'Hey', '--name-file', path]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hey Hello, Ada!\n');
    assert.equal(result.stderr, '');
  });
});

test('keeps an option-shaped --name-file operand as its path when using prefix', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hello-name-'));
  try {
    writeFileSync(join(directory, '--prefix'), 'Ada\n');
    const result = run(['--prefix', 'Hey', '--name-file', '--prefix'], undefined, directory);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hey Hello, Ada!\n');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('documents prefix for the standalone command only', () => {
  assert.match(reference, /`node bin\/hello\.mjs`[\s\S]*`--prefix <text>`/);
  assert.match(reference, /`node bin\/hello\.mjs --prefix Hey Ada`[\s\S]*Hey Hello, Ada!/);
  assert.match(reference, /error: --prefix needs a value/);
  assert.match(reference, /not supported by\s+the installed `greet` command/);
});

test('documents repeat for the standalone hello command only', () => {
  assert.match(reference, /`node bin\/hello\.mjs`[\s\S]*`--repeat <n>`/);
  assert.match(reference, /default is `1`[\s\S]*whole decimal number from\s+`1` through `10`/);
  assert.match(reference, /`node bin\/hello\.mjs --shout --repeat 3 Ada`/);
  assert.match(reference, /not supported by\s+the installed `greet` command/);
});

test('documents standalone repeat syntax, default, range, and example in the README', () => {
  assert.match(readme, /`node bin\/hello\.mjs \[name\]`[\s\S]*`--repeat <n>`/);
  assert.match(readme, /default is `1`[\s\S]*whole decimal number from\s+`1` through `10`/);
  assert.match(readme, /`node bin\/hello\.mjs --repeat 3 Ada`/);
});

test('documents lowercase for the standalone hello command', () => {
  assert.match(reference, /`--lowercase`[\s\S]*`node bin\/hello\.mjs --lowercase Ada`[\s\S]*hello, ada!/);
  assert.match(reference, /cannot be combined with `--shout`/);
});

test('lowercases the selected greeting in either positional argument order', () => {
  for (const args of [['--lowercase', 'Ada'], ['Ada', '--lowercase']]) {
    const result = run(args);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'hello, ada!\n');
    assert.equal(result.stderr, '');
  }
});

test('lowercases default, name-file, Persian, and repeated greetings', () => {
  for (const [args, lang, expected] of [
    [['--lowercase'], undefined, 'hello, world!\n'],
    [['--lowercase'], 'fa', 'سلام، دنیا!\n'],
    [['--lowercase', '--repeat', '2'], 'fa', 'سلام، دنیا!\nسلام، دنیا!\n'],
  ]) {
    const result = run(args, lang);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
    assert.equal(result.stderr, '');
  }

  withNameFile('ADA\n', path => {
    const result = run(['--name-file', path, '--lowercase']);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'hello, ada!\n');
    assert.equal(result.stderr, '');
  });
});

test('rejects lowercase with shout in either option order', () => {
  for (const args of [['--lowercase', '--shout', 'Ada'], ['--shout', '--lowercase', 'Ada']]) {
    const result = run(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'error: --lowercase and --shout cannot be combined\n');
  }
});

test('keeps --lowercase as the operand of --name-file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hello-name-'));

  try {
    writeFileSync(join(directory, '--lowercase'), 'Ada\n');
    const readable = run(['--name-file', '--lowercase'], undefined, directory);
    assert.equal(readable.status, 0);
    assert.equal(readable.stdout, 'Hello, Ada!\n');
    assert.equal(readable.stderr, '');

    const unreadable = run(['--name-file', '--lowercase'], undefined, tmpdir());
    assert.equal(unreadable.status, 1);
    assert.equal(unreadable.stdout, '');
    assert.match(unreadable.stderr, /^Error: cannot read name file --lowercase: .+\n$/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('repeats a supplied greeting the requested number of times', () => {
  for (let count = 1; count <= 10; count += 1) {
    const result = run(['--repeat', String(count), 'Ada']);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, Ada!\n'.repeat(count));
    assert.equal(result.stderr, '');
  }
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
  for (const args of [['--repeat'], ...['0', '11', '999999999999999999999', '-1', '1.5', 'abc'].map(value => ['--repeat', value])]) {
    const result = run(args);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'error: --repeat must be a whole decimal number from 1 to 10\n');
  }
});

test('combines repeat with shout in either option order', () => {
  for (const args of [['--shout', '--repeat', '3', 'Ada'], ['--repeat', '3', '--shout', 'Ada']]) {
    const result = run(args);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'HELLO, ADA!\n'.repeat(3));
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

test('accepts more than one name without a usage message', () => {
  const result = run(['Ada', 'Grace']);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\nHello, Grace!\n');
  assert.equal(result.stderr, '');
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

test('treats --lang fa as an unknown option even with Persian LANG', () => {
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

  for (const args of [['--shout', '--unknown']]) {
    const result = run(args);

    assert.equal(result.status, 2, `status for ${args.join(' ')}`);
    assert.equal(result.stdout, '', `stdout for ${args.join(' ')}`);
    assert.equal(result.stderr, usage, `stderr for ${args.join(' ')}`);
  }
});

test('does not color greeting with --color auto when stdout is piped', () => {
  const result = spawnSync(process.execPath, [command, '--color', 'auto', 'Ada'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\n');
  assert.equal(result.stderr, '');
});

test('does not color greeting by default', () => {
  const result = run(['Ada'], undefined, undefined, true);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\n');
  assert.equal(result.stderr, '');
});

test('accepts --color auto flag in any position when piped', () => {
  for (const args of [['--color', 'auto', 'Ada'], ['Ada', '--color', 'auto']]) {
    const result = spawnSync(process.execPath, [command, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    assert.equal(result.status, 0, `status for ${args.join(' ')}`);
    assert.equal(result.stdout, 'Hello, Ada!\n', `output for ${args.join(' ')}`);
    assert.equal(result.stderr, '', `stderr for ${args.join(' ')}`);
  }
});

test('rejects --color without a mode operand', () => {
  const result = run(['--color']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'error: --color needs a mode\n');
});

test('rejects --color with an unsupported mode', () => {
  for (const mode of ['always', 'never', 'invalid', 'missing']) {
    const result = run(['--color', mode]);

    assert.equal(result.status, 1, `status for mode ${mode}`);
    assert.equal(result.stdout, '', `stdout for mode ${mode}`);
    assert.equal(result.stderr, `error: unsupported color mode: ${mode}\n`, `stderr for mode ${mode}`);
  }
});

test('rejects --color with an empty mode', () => {
  const result = run(['--color', '']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'error: unsupported color mode: \n');
});

test('treats a hyphen-prefixed --color operand as a path when used with --name-file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hello-color-'));

  try {
    writeFileSync(join(directory, '--color'), 'Ada\n');
    const result = run(['--name-file', '--color'], undefined, directory);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'Hello, Ada!\n');
    assert.equal(result.stderr, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('colors greeting with --color auto on a terminal', () => {
  const result = run(['--color', 'auto', 'Ada'], undefined, undefined, true);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, '\u001b[31mHello, Ada!\u001b[0m\n');
  assert.equal(result.stderr, '');
});

test('documents --color auto for the standalone command only', () => {
  assert.match(reference, /`node bin\/hello\.mjs`[\s\S]*`--color auto`/);
  assert.match(reference, /terminal-only behavior/);
  assert.match(reference, /error: --color needs a mode/);
  assert.match(reference, /unsupported color mode/);
});

test('colors each line with --prefix --shout --repeat --color auto on a terminal', () => {
  const result = run(['--prefix', 'Hey', '--shout', '--repeat', '2', '--color', 'auto', 'Ada'], undefined, undefined, true);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, '\u001b[31mHey HELLO, ADA!\u001b[0m\n\u001b[31mHey HELLO, ADA!\u001b[0m\n');
  assert.equal(result.stderr, '');
});

test('appends the suffix after the selected greeting', () => {
  for (const [args, expected] of [
    [['--suffix', 'See you', 'Ada'], 'Hello, Ada! See you\n'],
    [['Ada', '--suffix', 'See you'], 'Hello, Ada! See you\n'],
    [['--shout', '--suffix', 'See you', 'Ada'], 'HELLO, ADA! See you\n'],
    [['--prefix', 'Hey', '--suffix', 'Bye', 'Ada'], 'Hey Hello, Ada! Bye\n'],
  ]) {
    const result = run(args);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
  }
});

test('rejects a missing suffix value without printing a greeting', () => {
  const result = run(['Ada', '--suffix']);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'error: --suffix needs a value\n');
});

test('documents suffix for the standalone command', () => {
  assert.match(reference, /`node bin\/hello\.mjs`[\s\S]*`--suffix <text>`/);
  assert.match(reference, /after the selected greeting/);
  assert.match(reference, /error: --suffix needs a value/);
});

const runMulti = (...a) => run(a);

test('multiple names print one greeting per name in order', () => {
  const r = runMulti('Ada', 'Linus');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'Hello, Ada!\nHello, Linus!\n');
});

test('single name and no name are unchanged', () => {
  assert.equal(runMulti('Ada').stdout, 'Hello, Ada!\n');
  assert.equal(runMulti().stdout, 'Hello, world!\n');
});

test('multiple names: options apply to every name', () => {
  assert.equal(runMulti('--shout', 'Ada', 'Linus').stdout, 'HELLO, ADA!\nHELLO, LINUS!\n');
  assert.equal(runMulti('--lowercase', 'Ada', 'Linus').stdout, 'hello, ada!\nhello, linus!\n');
  assert.equal(runMulti('--prefix', 'Hey', 'Ada', 'Linus').stdout, 'Hey Hello, Ada!\nHey Hello, Linus!\n');
  assert.equal(runMulti('--suffix', 'Bye', 'Ada', 'Linus').stdout, 'Hello, Ada! Bye\nHello, Linus! Bye\n');
});

test('multiple names with --repeat repeat each name consecutively', () => {
  assert.equal(runMulti('--repeat', '2', 'Ada', 'Linus').stdout,
    'Hello, Ada!\nHello, Ada!\nHello, Linus!\nHello, Linus!\n');
});

test('--name-file with an extra name still exits 2 with usage', () => {
  const r = runMulti('--name-file', 'x.txt', 'Ada');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^Usage: /);
});

test('documents the multi-name form in the reference', () => {
  assert.match(reference, /node bin\/hello\.mjs Ada Linus/);
  assert.match(reference, /every name/i);
});

test('--count prints the greeting then the count line', () => {
  const result = run(['Ada', '--count']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\nGreeted 1 time(s).\n');
});

test('--count counts names times repeat', () => {
  const result = run(['Ada', 'Linus', '--repeat', '2', '--count']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\nHello, Ada!\nHello, Linus!\nHello, Linus!\nGreeted 4 time(s).\n');
});

test('--count with no name counts the default greeting', () => {
  const plain = run([]).stdout;
  const result = run(['--count']);
  assert.equal(result.stdout, `${plain}Greeted 1 time(s).\n`);
});

test('--count line stays plain under --color auto', () => {
  const result = run(['Ada', '--color', 'auto', '--count'], undefined, undefined, true);
  assert.equal(result.stdout, '\u001b[31mHello, Ada!\u001b[0m\nGreeted 1 time(s).\n');
});

test('output without --count has no Greeted line', () => {
  for (const args of [['Ada'], ['Ada', 'Linus'], ['Ada', '--repeat', '2']]) {
    const result = run(args);
    assert.equal(result.status, 0);
    assert.ok(!result.stdout.includes('Greeted'));
  }
  assert.equal(run(['Ada', 'Linus', '--repeat', '2']).stdout, 'Hello, Ada!\nHello, Ada!\nHello, Linus!\nHello, Linus!\n');
});

test('--count prints no Greeted line when the invocation fails', () => {
  const repeat = run(['--repeat', '0', '--count']);
  assert.equal(repeat.status, 1);
  assert.equal(repeat.stdout, '');
  assert.equal(repeat.stderr, 'error: --repeat must be a whole decimal number from 1 to 10\n');
  const unknown = run(['--bogus', '--count']);
  assert.equal(unknown.status, 2);
  assert.equal(unknown.stdout, '');
});

test('reference documents --count', () => {
  assert.match(reference, /--count/);
  assert.match(reference, /Greeted N time\(s\)\./);
  assert.match(reference, /node bin\/hello\.mjs Ada --count/);
});

test('--name gives a name like the positional', () => {
  const result = run(['--name', 'Ada']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\n');
  assert.equal(result.stdout, run(['Ada']).stdout);
});

test('--name is repeatable and ordered', () => {
  const result = run(['--name', 'Ada', '--name', 'Linus']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Ada!\nHello, Linus!\n');
  assert.equal(result.stdout, run(['Ada', 'Linus']).stdout);
});

test('--name values come after positional names', () => {
  const result = run(['Grace', '--name', 'Ada', 'Linus', '--name', 'Alan']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'Hello, Grace!\nHello, Linus!\nHello, Ada!\nHello, Alan!\n');
});

test('--name without a value prints usage and exits 1', () => {
  for (const args of [['--name'], ['Ada', '--name']]) {
    const result = run(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Usage:/);
  }
});

test('--name combines with other options', () => {
  const shout = run(['--shout', '--repeat', '2', '--name', 'Ada']);
  assert.equal(shout.status, 0);
  assert.equal(shout.stdout, 'HELLO, ADA!\nHELLO, ADA!\n');
  const count = run(['--name', 'Ada', '--count']);
  assert.equal(count.status, 0);
  assert.equal(count.stdout, 'Hello, Ada!\nGreeted 1 time(s).\n');
});

test('reference documents --name', () => {
  assert.match(reference, /--name <value>/);
  assert.match(reference, /positional names are greeted first/);
  assert.match(reference, /exits with status 1/);
});

test('--quiet drops only the final trailing newline', () => {
  const cases = [
    [['Ada', '--quiet'], 'Hello, Ada!'],
    [['Ada', 'Linus', '--quiet'], 'Hello, Ada!\nHello, Linus!'],
    [['--repeat', '2', 'Ada', '--quiet'], 'Hello, Ada!\nHello, Ada!'],
    [['Ada', '--count', '--quiet'], 'Hello, Ada!\nGreeted 1 time(s).'],
  ];
  for (const [args, expected] of cases) {
    const result = run(args);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, expected);
  }
  const bare = run(['--quiet']);
  assert.equal(bare.status, 0);
  assert.equal(bare.stdout, run([]).stdout.replace(/\n$/, ''));
  assert.equal(run(['Ada']).stdout, 'Hello, Ada!\n');
});

test('reference documents --quiet', () => {
  assert.match(reference, /--quiet/);
  assert.match(reference, /final trailing\s+newline/);
});

function runStdin(args, input) {
  return spawnSync(process.execPath, [command, ...args], { encoding: 'utf8', input });
}

test('--stdin greets each stdin name', () => {
  const r = runStdin(['--stdin'], 'Ada\nLinus\n');
  assert.equal(r.stdout, 'Hello, Ada!\nHello, Linus!\n');
  assert.equal(r.status, 0);
});

test('--stdin skips blank and whitespace-only lines', () => {
  assert.equal(runStdin(['--stdin'], '\nAda\n   \n\t\nLinus\n\n').stdout, 'Hello, Ada!\nHello, Linus!\n');
});

test('--stdin handles CRLF and missing final newline', () => {
  assert.equal(runStdin(['--stdin'], 'Ada\r\nLinus').stdout, 'Hello, Ada!\nHello, Linus!\n');
});

test('--stdin names come after positional names', () => {
  assert.equal(runStdin(['--stdin', 'Grace'], 'Ada\n').stdout, 'Hello, Grace!\nHello, Ada!\n');
});

test('--stdin names come after --name values', () => {
  assert.equal(runStdin(['--stdin', '--name', 'Grace'], 'Ada\n').stdout, 'Hello, Grace!\nHello, Ada!\n');
});

test('--stdin orders positional, --name, then stdin', () => {
  assert.equal(
    runStdin(['--name', 'Bob', '--stdin', 'Grace'], 'Ada\n').stdout,
    'Hello, Grace!\nHello, Bob!\nHello, Ada!\n',
  );
});

test('--stdin with empty input prints nothing and exits 0', () => {
  for (const input of ['', '\n  \n']) {
    const r = runStdin(['--stdin'], input);
    assert.equal(r.stdout, '');
    assert.equal(r.status, 0);
  }
});

test('options apply to stdin names', () => {
  const r = runStdin(['--stdin', '--repeat', '2', '--count', '--shout'], 'Ada\nLinus\n');
  assert.equal(r.stdout, 'HELLO, ADA!\nHELLO, ADA!\nHELLO, LINUS!\nHELLO, LINUS!\nGreeted 4 time(s).\n');
});

test('--stdin with --name-file prints usage and exits 2', () => {
  const r = runStdin(['--stdin', '--name-file', 'x.txt'], 'Ada\n');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^Usage:/);
  assert.equal(r.stdout, '');
});

test('without --stdin, stdin is ignored', () => {
  assert.equal(runStdin([], 'Ada\n').stdout, 'Hello, world!\n');
  assert.equal(runStdin(['Linus'], 'Ada\n').stdout, 'Hello, Linus!\n');
});

test('reference documents --stdin', () => {
  assert.match(reference, /`--stdin`/);
  assert.match(reference, /one per line/);
  assert.match(reference, /Blank and whitespace-only lines are skipped/);
  assert.match(reference, /greeted last/);
  assert.match(reference, /cannot be combined\s+with `--name-file`/);
});

test('--stdin reports an unreadable standard input and exits 1', () => {
  const r = spawnSync(process.execPath, [command, '--stdin', '--count'], { encoding: 'utf8', stdio: [openSync(tmpdir(), 'r'), 'pipe', 'pipe'] });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /cannot read standard input/);
});

test('--upper is an alias of --shout', () => {
  const pairs = [
    [['--upper', 'Ada'], ['--shout', 'Ada']],
    [['Ada', '--upper'], ['Ada', '--shout']],
    [['--upper', '--repeat', '3', 'Ada'], ['--shout', '--repeat', '3', 'Ada']],
    [['--upper', '--lowercase', 'Ada'], ['--shout', '--lowercase', 'Ada']],
  ];
  for (const [a, b] of pairs) {
    const x = spawnSync(process.execPath, [command, ...a], { encoding: 'utf8' });
    const y = spawnSync(process.execPath, [command, ...b], { encoding: 'utf8' });
    assert.equal(x.stdout, y.stdout);
    assert.equal(x.status, y.status);
  }
  const ok = spawnSync(process.execPath, [command, '--upper', 'Ada'], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, 'HELLO, ADA!\n');
  const rep = spawnSync(process.execPath, [command, '--upper', '--repeat', '3', 'Ada'], { encoding: 'utf8' });
  assert.equal(rep.stdout, 'HELLO, ADA!\n'.repeat(3));
  const bad = spawnSync(process.execPath, [command, '--upper', '--lowercase', 'Ada'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
  assert.notEqual(bad.stderr, '');
});

test('reference docs state --upper is an alias of --shout', () => {
  assert.match(reference, /`--upper` as an alias of `--shout`/);
});
