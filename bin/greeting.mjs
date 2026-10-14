export function greeting(name) {
  const persian = process.env.LANG?.split(/[_.@-]/, 1)[0] === 'fa';
  const greeting = persian ? 'سلام،' : 'Hello,';
  const defaultName = persian ? 'دنیا' : 'world';
  const normalizedName = name?.trim();

  return `${greeting} ${normalizedName ?? defaultName}!`;
}
