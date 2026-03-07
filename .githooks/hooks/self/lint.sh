#!/usr/bin/env bash
# Hooks self-linting: shellcheck + shell policy rules.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
source "$ROOT_DIR/.githooks/lib/runtime.sh"

get_hook_files_array
require_tool shellcheck "brew install shellcheck"
require_tool node "required for shell rule checks"
cd "$ROOT_DIR"

"$ROOT_DIR/node_modules/.bin/concurrently" \
    "shellcheck -e SC2016 $(printf '%q ' "${FILES[@]}")" \
    "node linting/shell/docs.js --scope hooks" \
    "node linting/shell/disable-justification.js --scope hooks" \
    "node linting/shell/length.js --scope hooks" \
    "node linting/shell/naming.js --scope hooks" \
    "node linting/shell/structure/check.js --scope hooks" \
    "bun run lint:rules"

exit 0
