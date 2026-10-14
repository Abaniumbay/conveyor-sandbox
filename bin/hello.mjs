import { readFileSync } from 'node:fs';
import { greeting } from './greeting.mjs';

const args = process.argv.slice(2);
const nameFileIndex = args.indexOf('--name-file');
const unknownOptionIndex = args.findIndex((arg, index) =>
  arg.startsWith('-') && arg !== '--name-file' && !(nameFileIndex !== -1 && index === nameFileIndex + 1),
);
const usage = 'Usage: node bin/hello.mjs [name | --name-file <path>] (at most one name source accepted)';

if (unknownOptionIndex !== -1 || (nameFileIndex !== -1 && (args.length !== 2 || nameFileIndex !== 0))) {
  console.error(usage);
  process.exitCode = 2;
} else if (nameFileIndex === -1 && args.length > 1) {
  console.error(usage);
  process.exitCode = 2;
} else if (nameFileIndex === 0) {
  const path = args[1];

  try {
    const contents = readFileSync(path, 'utf8');
    const firstLine = contents.split(/\r?\n/, 1)[0];
    console.log(greeting(firstLine));
  } catch (error) {
    console.error(`Error: cannot read name file ${path}: ${error.message}`);
    process.exitCode = 1;
  }
} else {
  console.log(greeting(args[0]));
}
