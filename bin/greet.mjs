#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { greeting } from './greeting.mjs';

const args = process.argv.slice(2);
const command = args[0];
const name = args[1];
const usage = `Usage: greet ${command === 'session' ? 'session' : 'farewell'} [name]`;
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function farewell(name) {
  return name === undefined ? 'Goodbye!' : `Goodbye, ${name}!`;
}

if (command === '--version' && args.length === 1) {
  console.log(version);
} else if (!['farewell', 'session'].includes(command) || args.length > 2) {
  console.error(usage);
  process.exitCode = 2;
} else if (command === 'session') {
  console.log(greeting(name));
  console.log(farewell(name));
} else {
  console.log(farewell(name));
}
