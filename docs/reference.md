# Item-view sample content

This reference is sample content for exercising wide item-view rendering. The
options and environment variables below are illustrative and are not
implemented by the current greeting command.

The standalone greeting command, `node bin/hello.mjs`, supports
`--repeat <n>` to print the selected greeting `n` times, one per line. The
default is `1`; `n` must be a whole decimal number from `1` through `10`. For example,
`node bin/hello.mjs --shout --repeat 3 Ada` prints the uppercase greeting three
times. This option belongs to the standalone command and is not supported by
the installed `greet` command.

The standalone command also supports `--lowercase` to print the complete
selected greeting in lower case. For example, `node bin/hello.mjs --lowercase Ada`
prints `hello, ada!`. `--lowercase` cannot be combined with `--shout`.

The standalone command also supports `--prefix <text>` to place the supplied
text and a space before the selected greeting. For example,
`node bin/hello.mjs --prefix Hey Ada` prints `Hey Hello, Ada!`. This option
belongs to `node bin/hello.mjs` and is not supported by the installed `greet`
command. Omitting the value prints `error: --prefix needs a value` to stderr
and exits with status 1.

The installed `greet` command supports `--version`, which prints the package
version from `package.json` and exits 0 without greeting. It wins over any other
arguments, wherever it appears.

The standalone command also supports `--color auto` to apply ANSI color codes
to the greeting. This option has terminal-only behavior: when stdout is a terminal,
`node bin/hello.mjs --color auto Ada` prints the greeting in red. When stdout
is redirected to a pipe or file, no color codes are applied. Omitting the `--color`
option leaves output uncolored. Omitting the mode operand prints `error: --color needs a mode`
to stderr and exits with status 1. Unsupported color modes result in
`error: unsupported color mode: <mode>` and exit with status 1.

| Option | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `--name` | `HELLO_NAME` | `world` | Who is greeted |
| `--punctuation` | `HELLO_PUNCTUATION` | `!` | The character that ends the greeting |
| `--uppercase` | `HELLO_UPPERCASE` | `false` | Print the greeting in capitals |

Sample command for exercising a long, uninterrupted code line in item views:

```sh
HELLO_NAME=AVeryLongNameWithoutSpacesThatShouldNotWidenTheConversationPanelOnAPhoneScreenAtAll node bin/hello.mjs --punctuation '?' --uppercase
```

Sample link for exercising an uninterrupted path in item views: [https://example.com/a/really/long/path/that/keeps/going/and/going/without/any/natural/break/points/whatsoever](https://example.com/a/really/long/path/that/keeps/going/and/going/without/any/natural/break/points/whatsoever)
