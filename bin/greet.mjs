#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { greeting } from './greeting.mjs';

const args = process.argv.slice(2);
const command = args[0];
const name = args[1];
const usage = `Usage: greet ${command === 'session' ? 'session' : 'farewell'} [name]`;
const helpText = `Usage: greet [--help | -h | --version | farewell [name] | session [name]]
  --help, -h       Print this usage text.
  --version        Print the package version.
  farewell [name]  Print a goodbye, optionally to a name.
  session [name]   Print a greeting followed by a goodbye.`;
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function farewell(name) {
  return name === undefined ? 'Goodbye!' : `Goodbye, ${name}!`;
}

if ((command === '--help' || command === '-h') && args.length === 1) {
  console.log(helpText);
} else if (args.includes('--version')) {
  console.log(version);
} else if (command?.startsWith('-')) {
  console.error(helpText);
  process.exitCode = 1;
} else if (!['farewell', 'session'].includes(command) || args.length > 2) {
  console.error(usage);
  process.exitCode = 2;
} else if (command === 'session') {
  const sessionName = name?.trim() || undefined;
  console.log(greeting(sessionName));
  console.log(farewell(sessionName));
} else {
  console.log(farewell(name));
}
