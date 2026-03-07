#!/usr/bin/env bash
# Shared constants for git hooks. Sourced by lib/runtime.sh.

# lint:justify -- reason: configuration file sourced by other scripts -- ticket: N/A
# shellcheck disable=SC2034

RED='\033[0;31m'
NC='\033[0m'

TIMEOUT_GLOBAL_CHECKS=120
TIMEOUT_PARALLEL_HOOKS=300

HOOK_FILE_PATTERN='^\.githooks/.*\.sh$|^\.githooks/(pre-commit|pre-push|commit-msg)$'
PROD_ENV_PATTERN='(^|/)\.env\.(prod|production)$'
