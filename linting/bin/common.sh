#!/usr/bin/env bash
# Shared runtime helpers for repo-local lint tool wrappers.

set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${BIN_DIR}/../install/common.sh"
load_tooling_config

# tool_version_is_current - Returns success when a local binary matches the pinned version marker.
tool_version_is_current() {
    local local_bin="$1"
    local version_file="$2"
    local expected_version="$3"
    [[ -x "${local_bin}" && -f "${version_file}" && "$(<"${version_file}")" == "${expected_version}" ]]
}

# bootstrap_requested - Returns success when tooling bootstrap is allowed to install local binaries.
bootstrap_requested() {
    [[ "${LANDING_BOOTSTRAP_TOOL:-0}" == "1" ]]
}

# announce_local_install - Prints a consistent install message for repo-local tool bootstraps.
announce_local_install() {
    local label="$1"
    echo "installing local ${label}..." >&2
}

# fail_missing_tool - Aborts with a consistent bootstrap instruction.
fail_missing_tool() {
    local label="$1"
    echo "error: ${label} is not bootstrapped. Run: bun run setup:tooling" >&2
    exit 1
}

# prepend_python_warning_filter - Prepends a warning filter without discarding existing filters.
prepend_python_warning_filter() {
    local warning_filter="$1"

    if [[ -n "${PYTHONWARNINGS:-}" ]]; then
        export PYTHONWARNINGS="${warning_filter},${PYTHONWARNINGS}"
    else
        export PYTHONWARNINGS="${warning_filter}"
    fi
}
