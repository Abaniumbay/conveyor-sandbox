import { readFileSync } from 'node:fs';
import { greeting } from './greeting.mjs';

const rawArgs = process.argv.slice(2);
const rawNameFileIndex = rawArgs.indexOf('--name-file');
const isNameFileOperand = index => rawNameFileIndex !== -1 && index === rawNameFileIndex + 1;
const isShoutFlag = (arg, index) => arg === '--shout' && !isNameFileOperand(index);
const shout = rawArgs.some(isShoutFlag);
const args = rawArgs.filter((arg, index) => !isShoutFlag(arg, index));
const nameFileIndex = args.indexOf('--name-file');
const unknownOptionIndex = args.findIndex((arg, index) =>
  arg.startsWith('-') && arg !== '--name-file' && !(nameFileIndex !== -1 && index === nameFileIndex + 1),
);
const usage = 'Usage: node bin/hello.mjs [name | --name-file <path>] (at most one name source accepted)';
const printGreeting = name => {
  const message = greeting(name);
  console.log(shout ? message.toUpperCase() : message);
};

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
    printGreeting(firstLine);
  } catch (error) {
    console.error(`Error: cannot read name file ${path}: ${error.message}`);
    process.exitCode = 1;
  }
} else {
  printGreeting(args[0]);
}
