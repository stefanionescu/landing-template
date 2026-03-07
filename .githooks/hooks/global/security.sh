#!/usr/bin/env bash
# Global security checks for commit/push hooks.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
source "$ROOT_DIR/.githooks/lib/runtime.sh"

MODE="$(parse_hook_mode "${1:-commit}")"
cd "$ROOT_DIR"

case "$MODE" in
    commit)
        if [[ "${SKIP_ENV_CHECK:-0}" != "1" ]]; then
            PROD_ENVS="$(git diff --cached --name-only | grep -iE "$PROD_ENV_PATTERN" || true)"
            if [[ -n "$PROD_ENVS" ]]; then
                echo "Production environment files staged:"
                echo "$PROD_ENVS"
                echo "Remove from staging or bypass: SKIP_ENV_CHECK=1 git commit"
                exit 1
            fi
        fi
        ;;
    push)
        if [[ "${SKIP_SECURITY_SCANS:-0}" != "1" ]]; then
            bun run security:scan
        fi

        if [[ "${SKIP_LICENSE_CHECK:-0}" == "1" ]]; then
            exit 0
        fi

        bun run lint:license
        ;;
esac

exit 0
