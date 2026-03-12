#!/usr/bin/env bash
# GitHub-backed runtime helpers for repo-local lint tool wrappers.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/../install/github.sh"

# install_github_binary_asset - Downloads one binary asset into the repo-local tool cache.
install_github_binary_asset() {
    local repo="$1"
    local tag="$2"
    local asset_name="$3"
    local local_bin="$4"
    local version_file="$5"
    local version="$6"
    local local_dir tmp_dir

    local_dir="$(dirname "${local_bin}")"
    mkdir -p "${local_dir}"

    tmp_dir="$(mktemp -d)"
    trap 'rm -rf "'"${tmp_dir}"'"' RETURN

    download_github_asset "${repo}" "${tag}" "${asset_name}" "${tmp_dir}/${asset_name}"
    install -m 0755 "${tmp_dir}/${asset_name}" "${local_bin}"
    printf '%s\n' "${version}" >"${version_file}"
}

# install_github_tar_binary_asset - Extracts one archived binary asset into the repo-local tool cache.
install_github_tar_binary_asset() {
    local repo="$1"
    local tag="$2"
    local asset_name="$3"
    local archived_binary_path="$4"
    local local_bin="$5"
    local version_file="$6"
    local version="$7"
    local local_dir tmp_dir

    local_dir="$(dirname "${local_bin}")"
    mkdir -p "${local_dir}"

    tmp_dir="$(mktemp -d)"
    trap 'rm -rf "'"${tmp_dir}"'"' RETURN

    download_github_asset "${repo}" "${tag}" "${asset_name}" "${tmp_dir}/${asset_name}"
    tar -xzf "${tmp_dir}/${asset_name}" -C "${tmp_dir}"
    install -m 0755 "${tmp_dir}/${archived_binary_path}" "${local_bin}"
    printf '%s\n' "${version}" >"${version_file}"
}

# run_github_binary_tool - Executes a pinned GitHub-downloaded binary from the repo-local tool cache.
run_github_binary_tool() {
    local command_name="$1"
    local version="$2"
    local repo="$3"
    local tool_dir_name="$4"
    local binary_name="$5"
    local tag="$6"
    local asset_name="$7"
    local local_dir local_bin version_file
    shift 7

    local_dir="${REPO_ROOT}/${TOOLING_TOOLS_RELATIVE_DIR}/${tool_dir_name}"
    local_bin="${local_dir}/${binary_name}"
    version_file="${local_dir}/.version"

    if tool_version_is_current "${local_bin}" "${version_file}" "${version}"; then
        exec "${local_bin}" "$@"
    fi

    if bootstrap_requested; then
        announce_local_install "${command_name} ${version}"
        install_github_binary_asset "${repo}" "${tag}" "${asset_name}" "${local_bin}" "${version_file}" "${version}"
        exec "${local_bin}" "$@"
    fi

    fail_missing_tool "${command_name} ${version}"
}

# run_github_tar_tool - Executes a pinned archived GitHub binary from the repo-local tool cache.
run_github_tar_tool() {
    local command_name="$1"
    local version="$2"
    local repo="$3"
    local tool_dir_name="$4"
    local binary_name="$5"
    local tag="$6"
    local asset_name="$7"
    local archived_binary_path="$8"
    local local_dir local_bin version_file
    shift 8

    local_dir="${REPO_ROOT}/${TOOLING_TOOLS_RELATIVE_DIR}/${tool_dir_name}"
    local_bin="${local_dir}/${binary_name}"
    version_file="${local_dir}/.version"

    if tool_version_is_current "${local_bin}" "${version_file}" "${version}"; then
        exec "${local_bin}" "$@"
    fi

    if bootstrap_requested; then
        announce_local_install "${command_name} ${version}"
        install_github_tar_binary_asset \
            "${repo}" \
            "${tag}" \
            "${asset_name}" \
            "${archived_binary_path}" \
            "${local_bin}" \
            "${version_file}" \
            "${version}"
        exec "${local_bin}" "$@"
    fi

    fail_missing_tool "${command_name} ${version}"
}
