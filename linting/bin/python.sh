#!/usr/bin/env bash
# Python-backed runtime helpers for repo-local lint tool wrappers.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../install/python.sh"

# run_python_tool - Executes a pinned Python package binary from the repo-local tool cache.
run_python_tool() {
    local command_name="$1"
    local version="$2"
    local venv_name="$3"
    local package_name="$4"
    local binary_name="$5"
    local local_bin version_file expected_version
    shift 5

    local_bin="${REPO_ROOT}/${TOOLING_PYTHON_VENV_ROOT}/${venv_name}/bin/${binary_name}"
    version_file="${REPO_ROOT}/${TOOLING_PYTHON_VENV_ROOT}/${venv_name}/.package-version"
    expected_version="${package_name}==${version}"

    if tool_version_is_current "${local_bin}" "${version_file}" "${expected_version}"; then
        exec "${local_bin}" "$@"
    fi

    if bootstrap_requested; then
        announce_local_install "${command_name} ${version}"
        ensure_python_package_bin "${venv_name}" "${package_name}" "${version}" "${binary_name}"
        local_bin="${TOOLING_PYTHON_PACKAGE_BIN}"
        exec "${local_bin}" "$@"
    fi

    fail_missing_tool "${command_name} ${version}"
}
