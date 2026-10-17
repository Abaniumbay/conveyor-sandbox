# Item-view sample content

This reference is sample content for exercising wide item-view rendering. The
options and environment variables below are illustrative and are not
implemented by the current greeting command.

The standalone greeting command, `node bin/hello.mjs`, supports
`--repeat <n>` to print the selected greeting `n` times, one per line. The
default is `1`; `n` must be a positive whole decimal number. For example,
`node bin/hello.mjs --shout --repeat 3 Ada` prints the uppercase greeting three
times. This option belongs to the standalone command and is not supported by
the installed `greet` command.

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
