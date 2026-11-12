import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('../bin/greet.mjs', import.meta.url));
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

const options = [
  { name: '--version', args: ['--version'], example: 'greet --version', output: ['1.0.0'] },
  { name: 'farewell [name]', args: ['farewell', 'Sara'], example: 'greet farewell Sara', output: ['Goodbye, Sara!'] },
  { name: 'session [name]', args: ['session', 'Sara'], example: 'greet session Sara', output: ['Hello, Sara!', 'Goodbye, Sara!'] },
];

for (const option of options) {
  test(`README documents ${option.name} with a matching example`, () => {
    assert.ok(readme.includes(`\`${option.name}\``), 'option is listed');
    assert.ok(readme.includes(`\`${option.example}\``), 'example is listed');
    for (const line of option.output) assert.ok(readme.includes(line), `output ${line} is listed`);

    const result = spawnSync(process.execPath, [command, ...option.args], {
      encoding: 'utf8',
      env: { ...process.env, LANG: 'en_US.UTF-8' },
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout, `${option.output.join('\n')}\n`);
  });
}
