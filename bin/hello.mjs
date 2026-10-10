const args = process.argv.slice(2);

if (args.length > 1) {
  console.error('Usage: node bin/hello.mjs [name] (at most one name accepted)');
  process.exitCode = 2;
} else {
  const language = process.env.LANG?.split(/[_.@-]/, 1)[0];
  const greeting = language === 'fa'
    ? `سلام، ${args[0] ?? 'دنیا'}!`
    : `Hello, ${args[0] ?? 'world'}!`;

  console.log(greeting);
}
