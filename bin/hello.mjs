import { readFileSync } from 'node:fs';
import { greeting } from './greeting.mjs';

const rawArgs = process.argv.slice(2);
const rawNameFileIndex = rawArgs.indexOf('--name-file');
const isNameFileOperand = index => rawNameFileIndex !== -1 && index === rawNameFileIndex + 1;
const args = [];
let shout = false;
let lowercase = false;
let prefix;
let invalidPrefix = false;
let repeat = 1n;
let repeatSpecified = false;
let invalidRepeat = false;
let duplicateRepeat = false;
let colorMode;
let colorModeMissing = false;
let colorModeError = null;

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (isNameFileOperand(index)) {
    args.push(arg);
  } else if (arg === '--prefix') {
    if (index + 1 >= rawArgs.length || isNameFileOperand(index + 1)) {
      invalidPrefix = true;
    } else {
      prefix = rawArgs[index + 1];
      index += 1;
    }
  } else if (arg === '--shout') {
    shout = true;
  } else if (arg === '--lowercase') {
    lowercase = true;
  } else if (arg === '--repeat') {
    if (repeatSpecified) duplicateRepeat = true;
    repeatSpecified = true;
    if (index + 1 >= rawArgs.length || isNameFileOperand(index + 1)) {
      invalidRepeat = true;
    } else {
      const value = rawArgs[index + 1];
      index += 1;
      if (!/^\d+$/.test(value) || BigInt(value) < 1n || BigInt(value) > 10n) {
        invalidRepeat = true;
      } else {
        repeat = BigInt(value);
      }
    }
  } else if (arg === '--color') {
    if (index + 1 >= rawArgs.length || isNameFileOperand(index + 1)) {
      colorModeMissing = true;
    } else {
      const mode = rawArgs[index + 1];
      index += 1;
      if (mode === 'auto') {
        colorMode = 'auto';
      } else {
        colorModeError = mode;
      }
    }
  } else {
    args.push(arg);
  }
}

const nameFileIndex = args.indexOf('--name-file');
const unknownOptionIndex = args.findIndex((arg, index) =>
  arg.startsWith('-') && arg !== '--name-file' && !(nameFileIndex !== -1 && index === nameFileIndex + 1),
);
const usage = 'Usage: node bin/hello.mjs [name | --name-file <path>] (at most one name source accepted)';
const shouldUseColor = colorMode === 'auto' && (process.env.FORCE_TTY === '1' || process.stdout.isTTY);
const printGreeting = name => {
  const message = greeting(name);
  const selectedMessage = shout ? message.toUpperCase() : lowercase ? message.toLowerCase() : message;
  const output = prefix === undefined ? selectedMessage : `${prefix} ${selectedMessage}`;
  for (let count = 0n; count < repeat; count += 1n) {
    if (shouldUseColor) {
      console.log(`\u001b[31m${output}\u001b[0m`);
    } else {
      console.log(output);
    }
  }
};

if (shout && lowercase) {
  console.error('error: --lowercase and --shout cannot be combined');
  process.exitCode = 1;
} else if (invalidRepeat) {
  console.error('error: --repeat must be a whole decimal number from 1 to 10');
  process.exitCode = 1;
} else if (invalidPrefix) {
  console.error('error: --prefix needs a value');
  process.exitCode = 1;
} else if (colorModeMissing) {
  console.error('error: --color needs a mode');
  process.exitCode = 1;
} else if (colorModeError !== null) {
  console.error(`error: unsupported color mode: ${colorModeError}`);
  process.exitCode = 1;
} else if (duplicateRepeat || unknownOptionIndex !== -1 || (nameFileIndex !== -1 && (args.length !== 2 || nameFileIndex !== 0))) {
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
