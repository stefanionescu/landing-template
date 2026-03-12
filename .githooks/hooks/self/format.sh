#!/usr/bin/env bash
# Hooks format checks: shfmt diff mode (if available).

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
source "$ROOT_DIR/.githooks/lib/runtime.sh"

get_hook_files_array
cd "$ROOT_DIR"
bash linting/bin/shfmt.sh -d "${FILES[@]}"

exit 0
