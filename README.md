# conveyor-sandbox
Throwaway repository for testing Conveyor changes on the staging instance

## greet options

| Option | Description | Example |
| --- | --- | --- |
| `--version` | Print the package version. | `greet --version` prints `1.0.0` |
| `farewell [name]` | Print a goodbye, optionally to a name. | `greet farewell Sara` prints `Goodbye, Sara!` |
| `session [name]` | Print a greeting followed by a goodbye. | `greet session Sara` prints `Hello, Sara!` then `Goodbye, Sara!` |

## Running tests

Use Node.js 22, then run `npm test`.

## Checks

To verify the temporary directory is working, run:

```
sh scripts/tmp-check.sh
```
