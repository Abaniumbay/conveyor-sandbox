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

The standalone command also accepts several names as separate arguments and
prints one greeting line per name, in the order given. For example,
`node bin/hello.mjs Ada Linus` prints `Hello, Ada!` and then `Hello, Linus!`.
With no name the default greeting is unchanged. Options such as `--shout`,
`--lowercase`, `--prefix`, `--suffix` and `--repeat` apply to every name; with
`--repeat 2 Ada Linus`, Ada is printed twice before Linus is printed twice.
`--name-file` cannot be combined with additional names.

The standalone command also supports `--lowercase` to print the complete
selected greeting in lower case. For example, `node bin/hello.mjs --lowercase Ada`
prints `hello, ada!`. `--lowercase` cannot be combined with `--shout`.

The standalone command also supports `--prefix <text>` to place the supplied
text and a space before the selected greeting. For example,
`node bin/hello.mjs --prefix Hey Ada` prints `Hey Hello, Ada!`. This option
belongs to `node bin/hello.mjs` and is not supported by the installed `greet`
command. Omitting the value prints `error: --prefix needs a value` to stderr
and exits with status 1.

The standalone command also supports `--suffix <text>` to place a space and the
supplied text after the selected greeting. For example,
`node bin/hello.mjs --suffix "See you" Ada` prints `Hello, Ada! See you`. The
suffix text is not changed by `--shout` or `--lowercase`. Omitting the value
prints `error: --suffix needs a value` to stderr and exits with status 1.

The standalone command also supports `--count` to print, after the greetings,
a plain-text line `Greeted N time(s).` where N is the number of greeting lines
printed. The line is never colored. For example,
`node bin/hello.mjs Ada --count` prints `Hello, Ada!` and then
`Greeted 1 time(s).`, and `node bin/hello.mjs Ada Linus --repeat 2 --count`
ends with `Greeted 4 time(s).`. Without `--count` output is unchanged, and when
the invocation fails no `Greeted` line is printed.

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

For testing and diagnostics, the `FORCE_TTY=1` environment variable overrides
the TTY check and forces color output even when stdout is piped. This is used
internally by test suites to verify colored output without requiring a pseudo-terminal.

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
