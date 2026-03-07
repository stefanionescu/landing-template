#!/usr/bin/env bash
# Global lint checks for commit/push hooks.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
source "$ROOT_DIR/.githooks/lib/runtime.sh"

MODE="$(parse_hook_mode "${1:-commit}")"
cd "$ROOT_DIR"

case "$MODE" in
    commit)
        bun run lint:code
        if [[ "${SKIP_KNIP:-0}" != "1" ]]; then
            bun run lint:knip
        fi
        if [[ "${SKIP_TYPOS:-0}" != "1" ]]; then
            bun run lint:typos
        fi
        if [[ "${SKIP_LINT_PKG:-0}" != "1" ]]; then
            bun run lint:pkg
        fi
        ;;
    push)
        bun run lint:md
        if [[ "${SKIP_EXTERNAL_LINKS:-0}" != "1" ]]; then
            bun run lint:links:external
        fi
        ;;
esac

exit 0
