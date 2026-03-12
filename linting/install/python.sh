#!/usr/bin/env bash
# Python virtualenv helpers for repo-local lint tooling.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"

# ensure_python_package_bin - Creates a tool-specific venv and stores the installed binary path.
ensure_python_package_bin() {
    local venv_name="$1"
    local package_name="$2"
    local package_version="$3"
    local binary_name="$4"
    local version_spec="${package_name}==${package_version}"

    require_python3

    local venv_dir="${REPO_ROOT}/${TOOLING_PYTHON_VENV_ROOT}/${venv_name}"
    local bin_path="${venv_dir}/bin/${binary_name}"
    local version_marker="${venv_dir}/.package-version"

    if [[ ! -x "${bin_path}" || ! -f "${version_marker}" || "$(<"${version_marker}")" != "${version_spec}" ]]; then
        rm -rf "${venv_dir}"
        mkdir -p "$(dirname "${venv_dir}")"
        python3 -m venv "${venv_dir}"
        "${venv_dir}/bin/pip" install --disable-pip-version-check --quiet "${version_spec}"
        printf '%s\n' "${version_spec}" >"${version_marker}"
    fi

    # lint:justify -- reason: consumed by sourced runtime wrappers after helper execution -- ticket: N/A
    # shellcheck disable=SC2034
    TOOLING_PYTHON_PACKAGE_BIN="${bin_path}"
}
