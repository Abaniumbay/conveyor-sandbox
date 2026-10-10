#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];
const name = args[1];
const usage = `Usage: greet ${command === 'session' ? 'session' : 'farewell'} [name]`;

function farewell(name) {
  return name === undefined ? 'Goodbye!' : `Goodbye, ${name}!`;
}

function greeting(name) {
  return `Hello, ${name === undefined ? 'world' : name}!`;
}

if (!['farewell', 'session'].includes(command) || args.length > 2) {
  console.error(usage);
  process.exitCode = 2;
} else if (command === 'session') {
  console.log(greeting(name));
  console.log(farewell(name));
} else {
  console.log(farewell(name));
}
