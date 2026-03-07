#!/bin/bash
# Shared download, checksum verification, and install helpers for security tools.

SECURITY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=linting/security/config.sh
source "$SECURITY_DIR/config.sh"

# sha256_file — Computes the SHA-256 hash of a file using shasum, sha256sum, or openssl.
sha256_file() {
    local path="$1"
    if command -v "${SECURITY_HASH_COMMAND_SHASUM}" >/dev/null 2>&1; then
        "${SECURITY_HASH_COMMAND_SHASUM}" -a 256 "${path}" | awk '{print $1}'
        return 0
    fi
    if command -v "${SECURITY_HASH_COMMAND_SHA256SUM}" >/dev/null 2>&1; then
        "${SECURITY_HASH_COMMAND_SHA256SUM}" "${path}" | awk '{print $1}'
        return 0
    fi
    if command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "${path}" | awk '{print $NF}'
        return 0
    fi
    echo "error: unable to compute sha256 (missing shasum/sha256sum/openssl)" >&2
    exit 1
}

# require_download_command — Exits with an error if curl is not available.
require_download_command() {
    local tool_name="$1"
    if ! command -v "${SECURITY_DOWNLOAD_COMMAND}" >/dev/null 2>&1; then
        echo "error: ${SECURITY_DOWNLOAD_COMMAND} is required to install fallback ${tool_name}" >&2
        exit 1
    fi
}

# resolve_os — Detects the current OS and prints the matching identifier from two arguments.
resolve_os() {
    local darwin_value="$1"
    local linux_value="$2"
    local tool_name="$3"
    local uname_s
    uname_s="$(uname -s | tr '[:upper:]' '[:lower:]')"
    case "${uname_s}" in
        darwin) echo "${darwin_value}" ;;
        linux) echo "${linux_value}" ;;
        *)
            echo "error: unsupported OS for ${tool_name} fallback (${uname_s})" >&2
            exit 1
            ;;
    esac
}

# resolve_arch — Detects the CPU architecture and prints the matching identifier from two arguments.
resolve_arch() {
    local x64_value="$1"
    local arm64_value="$2"
    local tool_name="$3"
    local uname_m
    uname_m="$(uname -m)"
    case "${uname_m}" in
        x86_64 | amd64) echo "${x64_value}" ;;
        arm64 | aarch64) echo "${arm64_value}" ;;
        *)
            echo "error: unsupported architecture for ${tool_name} fallback (${uname_m})" >&2
            exit 1
            ;;
    esac
}

# download_and_verify — Downloads an asset, verifies its SHA-256 checksum, and prints the temp dir path.
download_and_verify() {
    local base_url="$1" asset_name="$2" checksums_name="$3"
    local tmp_dir
    tmp_dir="$(mktemp -d)"
    local archive_path="${tmp_dir}/${asset_name}"
    local checksums_path="${tmp_dir}/${checksums_name}"
    "${SECURITY_DOWNLOAD_COMMAND}" -fsSL "${base_url}/${asset_name}" -o "${archive_path}"
    "${SECURITY_DOWNLOAD_COMMAND}" -fsSL "${base_url}/${checksums_name}" -o "${checksums_path}"
    local expected_sha
    expected_sha="$(awk -v target="${asset_name}" '$2==target { print $1 }' "${checksums_path}")"
    if [[ -z "${expected_sha}" ]]; then
        echo "error: checksum entry missing for ${asset_name}" >&2
        rm -rf "${tmp_dir}"
        exit 1
    fi
    local actual_sha
    actual_sha="$(sha256_file "${archive_path}")"
    if [[ "${actual_sha}" != "${expected_sha}" ]]; then
        echo "error: checksum mismatch for ${asset_name}" >&2
        echo "expected: ${expected_sha}" >&2
        echo "actual:   ${actual_sha}" >&2
        rm -rf "${tmp_dir}"
        exit 1
    fi
    echo "${tmp_dir}"
}
