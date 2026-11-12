#!/usr/bin/env bash
# Runs the repository checks. --changed-only is accepted; the suite is small, so it always runs in full.
set -euo pipefail
cd "$(dirname "$0")/.."
exec npm test --silent
