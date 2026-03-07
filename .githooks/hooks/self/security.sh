#!/usr/bin/env bash
# Hooks security checks: Semgrep with tight hook rules.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
source "$ROOT_DIR/.githooks/lib/runtime.sh"

require_tool semgrep "brew install semgrep"
cd "$ROOT_DIR"
bash linting/semgrep/run.sh hooks

exit 0
