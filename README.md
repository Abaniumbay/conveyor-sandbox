# conveyor-sandbox
Throwaway repository for testing Conveyor changes on the staging instance

## greet options

| Option | Description | Example |
| --- | --- | --- |
| `--help`, `-h` | Print usage and exit 0. Unknown options print it to stderr and exit 1. | `greet --help` prints `Usage: greet [--help \| -h \| --version \| farewell [name] \| session [name]]` followed by one line per option |
| `--version` | Print the package version. | `greet --version` prints `1.0.0` |
| `farewell [name]` | Print a goodbye, optionally to a name. | `greet farewell Sara` prints `Goodbye, Sara!` |
| `session [name]` | Print a greeting followed by a goodbye. | `greet session Sara` prints `Hello, Sara!` then `Goodbye, Sara!` |

## Standalone greeting

Run `node bin/hello.mjs [name]` to print a greeting. The `--repeat <n>` option
prints it `n` times. The default is `1`; `n` must be a whole decimal number from
`1` through `10`. For example, `node bin/hello.mjs --repeat 3 Ada` prints the
greeting three times.

## Running tests

Use Node.js 22, then run `npm test`.

## Checks

To verify the temporary directory is working, run:

```
sh scripts/tmp-check.sh
```
