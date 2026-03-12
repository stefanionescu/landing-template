#!/usr/bin/env bash
# Installs the repo-local CLI tools needed for lint, hooks, and baseline security workflows.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"
load_tooling_config

# bootstrap_tool - Runs one wrapper with a version probe to force local installation.
bootstrap_tool() {
    local label="$1"
    shift
    echo "==> ${label}"
    LANDING_BOOTSTRAP_TOOL=1 "$@" >/dev/null
}

require_bun
require_python3

bootstrap_tool "shellcheck ${SHELLCHECK_VERSION}" bash "${SCRIPT_DIR}/../bin/shellcheck.sh" --version
bootstrap_tool "shfmt ${SHFMT_VERSION}" bash "${SCRIPT_DIR}/../bin/shfmt.sh" --version
bootstrap_tool "semgrep ${SEMGREP_VERSION}" bash "${SCRIPT_DIR}/../bin/semgrep.sh" --version
bootstrap_tool "lizard ${LIZARD_VERSION}" bash "${SCRIPT_DIR}/../bin/lizard.sh" --version
bootstrap_tool "gitleaks ${GITLEAKS_VERSION}" bash "${SCRIPT_DIR}/../security/gitleaks/run.sh" bootstrap
bootstrap_tool "osv-scanner ${OSV_SCANNER_VERSION}" bash "${SCRIPT_DIR}/../security/osv/run.sh" bootstrap

echo "repo-local lint/security tooling is ready."
