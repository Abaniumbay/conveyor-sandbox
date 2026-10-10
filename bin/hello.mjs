const args = process.argv.slice(2);

if (args.length > 1) {
  console.error('Usage: node bin/hello.mjs [name] (at most one name accepted)');
  process.exitCode = 2;
} else {
  console.log(`Hello, ${args[0] ?? 'world'}!`);
}
