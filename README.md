# conveyor-sandbox
Throwaway repository for testing Conveyor changes on the staging instance

Run `greet --version` to print the package version.

## Standalone greeting

Run `node bin/hello.mjs [name]` to print a greeting. The `--repeat <n>` option
prints it `n` times. The default is `1`; `n` must be a whole decimal number from
`1` through `10`. For example, `node bin/hello.mjs --repeat 3 Ada` prints the
greeting three times.

## Running tests

Use Node.js 22, then run `npm test`.
