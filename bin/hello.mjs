import { readFileSync } from 'node:fs';
import { greeting } from './greeting.mjs';

const rawArgs = process.argv.slice(2);
const rawNameFileIndex = rawArgs.indexOf('--name-file');
const isNameFileOperand = index => rawNameFileIndex !== -1 && index === rawNameFileIndex + 1;
const args = [];
const optionNames = [];
let invalidName = false;
let count = false;
let quiet = false;
let useStdin = false;
const outputLines = [];
let greetedLines = 0;
let shout = false;
let lowercase = false;
let prefix;
let invalidPrefix = false;
let suffix;
let invalidSuffix = false;
let bang = false;
let polite = false;
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
  } else if (arg === '--suffix') {
    if (index + 1 >= rawArgs.length || isNameFileOperand(index + 1)) {
      invalidSuffix = true;
    } else {
      suffix = rawArgs[index + 1];
      index += 1;
    }
  } else if (arg === '--bang') {
    bang = true;
  } else if (arg === '--polite') {
    polite = true;
  } else if (arg === '--name') {
    if (index + 1 >= rawArgs.length || isNameFileOperand(index + 1)) {
      invalidName = true;
    } else {
      optionNames.push(rawArgs[index + 1]);
      index += 1;
    }
  } else if (arg === '--count') {
    count = true;
  } else if (arg === '--stdin') {
    useStdin = true;
  } else if (arg === '--quiet') {
    quiet = true;
  } else if (arg === '--shout' || arg === '--upper') {
    shout = true;
  } else if (arg === '--lowercase' || arg === '--lower') {
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
args.push(...(nameFileIndex === -1 ? optionNames : []));
const shouldUseColor = colorMode === 'auto' && (process.env.FORCE_TTY === '1' || process.stdout.isTTY);
const printGreeting = name => {
  const message = greeting(polite && name?.trim() ? `Dear ${name.trim()}` : name);
  const selectedMessage = shout ? message.toUpperCase() : lowercase ? message.toLowerCase() : message;
  const prefixed = prefix === undefined ? selectedMessage : `${prefix} ${selectedMessage}`;
  const effectiveSuffix = bang ? '!' : suffix;
  const output = effectiveSuffix === undefined ? prefixed : `${prefixed} ${effectiveSuffix}`;
  for (let printed = 0n; printed < repeat; printed += 1n) {
    greetedLines += 1;
    if (shouldUseColor) {
      outputLines.push(`\u001b[31m${output}\u001b[0m`);
    } else {
      outputLines.push(output);
    }
  }
};

if (bang && (suffix !== undefined || invalidSuffix)) {
  console.error('error: --bang cannot be combined with --suffix');
  process.exitCode = 1;
} else if (shout && lowercase) {
  console.error('error: --lowercase and --shout cannot be combined');
  process.exitCode = 1;
} else if (invalidRepeat) {
  console.error('error: --repeat must be a whole decimal number from 1 to 10');
  process.exitCode = 1;
} else if (invalidName) {
  console.error(usage);
  process.exitCode = 1;
} else if (invalidPrefix) {
  console.error('error: --prefix needs a value');
  process.exitCode = 1;
} else if (invalidSuffix) {
  console.error('error: --suffix needs a value');
  process.exitCode = 1;
} else if (colorModeMissing) {
  console.error('error: --color needs a mode');
  process.exitCode = 1;
} else if (colorModeError !== null) {
  console.error(`error: unsupported color mode: ${colorModeError}`);
  process.exitCode = 1;
} else if (duplicateRepeat || unknownOptionIndex !== -1 || (nameFileIndex !== -1 && (optionNames.length > 0 || useStdin)) || (nameFileIndex !== -1 && (args.length !== 2 || nameFileIndex !== 0))) {
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
} else if (useStdin) {
  let input = '';
  let stdinFailed = false;
  try {
    input = readFileSync(0, 'utf8');
  } catch (error) {
    if (error.code !== 'EOF') {
      console.error(`Error: cannot read standard input: ${error.message}`);
      process.exitCode = 1;
      stdinFailed = true;
    }
  }
  if (!stdinFailed) {
    const stdinNames = input.split(/\r?\n/).filter(line => line.trim() !== '');
    for (const name of [...args, ...stdinNames]) printGreeting(name);
  }
} else if (args.length === 0) {
  printGreeting(undefined);
} else {
  for (const name of args) printGreeting(name);
}

if (count && process.exitCode === undefined) {
  outputLines.push(`Greeted ${greetedLines} time(s).`);
}

if (outputLines.length > 0) {
  process.stdout.write(outputLines.join('\n') + (quiet ? '' : '\n'));
}
