#!/usr/bin/env bash
# Local verification: runs the test suite. --changed-only is accepted for the
# Conveyor local gate; the suite is small, so it always runs in full.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node --test
