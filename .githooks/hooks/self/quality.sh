#!/usr/bin/env bash
# Hooks quality checks: dead funcs + CPD + knip.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
source "$ROOT_DIR/.githooks/lib/runtime.sh"

get_hook_files_array
cd "$ROOT_DIR"

require_tool node "required for hook quality checks"
require_tool bunx "install Bun to run hook quality checks"

"$ROOT_DIR/node_modules/.bin/concurrently" \
    "node linting/shell/unused-functions.js --scope hooks $(printf '%q ' "${FILES[@]}")" \
    "bunx jscpd --config .githooks/.jscpd/bash.json" \
    "bunx knip -c .githooks/knip.json --include files --no-progress"

exit 0
