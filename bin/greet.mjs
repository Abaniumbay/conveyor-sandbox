#!/usr/bin/env node

const usage = 'Usage: greet farewell [name]';
const args = process.argv.slice(2);

if (args[0] !== 'farewell' || args.length > 2) {
  console.error(usage);
  process.exitCode = 2;
} else {
  const name = args[1];
  console.log(name === undefined ? 'Goodbye!' : `Goodbye, ${name}!`);
}
