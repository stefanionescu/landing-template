#!/usr/bin/env bash
# Shared install/bootstrap helpers for repo-local lint tooling.

set -euo pipefail

TOOLING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${TOOLING_DIR}/../.." && pwd)"
TOOLING_CONFIG_FILE="${REPO_ROOT}/linting/config/tooling.env"
SECURITY_TOOL_VERSIONS_FILE="${REPO_ROOT}/linting/config/security/tool-versions.env"

# require_file - Exits when the provided file path does not exist.
require_file() {
    local file_path="$1"
    if [[ ! -f "${file_path}" ]]; then
        echo "error: missing ${file_path}" >&2
        exit 1
    fi
}

# load_tooling_config - Loads tooling config plus shared security tool versions.
load_tooling_config() {
    require_file "${TOOLING_CONFIG_FILE}"
    # lint:justify -- reason: file sourced at runtime, path not resolvable statically -- ticket: N/A
    # shellcheck disable=SC1090
    source "${TOOLING_CONFIG_FILE}"

    if [[ -f "${SECURITY_TOOL_VERSIONS_FILE}" ]]; then
        # lint:justify -- reason: file sourced at runtime, path not resolvable statically -- ticket: N/A
        # shellcheck disable=SC1090
        source "${SECURITY_TOOL_VERSIONS_FILE}"
    fi
}

# require_bun - Exits when Bun is unavailable.
require_bun() {
    if ! command -v bun >/dev/null 2>&1; then
        echo "error: bun is required to bootstrap repo-local tooling" >&2
        exit 1
    fi
}

# require_python3 - Exits when Python 3 is unavailable.
require_python3() {
    if ! command -v python3 >/dev/null 2>&1; then
        echo "error: python3 is required to install local semgrep/lizard tooling" >&2
        exit 1
    fi
}

# sha256_file - Computes a SHA-256 digest for one file.
sha256_file() {
    local file_path="$1"
    if command -v "${TOOLING_HASH_COMMAND_SHASUM}" >/dev/null 2>&1; then
        "${TOOLING_HASH_COMMAND_SHASUM}" -a 256 "${file_path}" | awk '{print $1}'
        return 0
    fi
    if command -v "${TOOLING_HASH_COMMAND_SHA256SUM}" >/dev/null 2>&1; then
        "${TOOLING_HASH_COMMAND_SHA256SUM}" "${file_path}" | awk '{print $1}'
        return 0
    fi
    if command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "${file_path}" | awk '{print $NF}'
        return 0
    fi

    echo "error: unable to compute sha256 (missing shasum/sha256sum/openssl)" >&2
    exit 1
}

# require_download_command - Exits when curl is unavailable for asset downloads.
require_download_command() {
    local tool_name="$1"
    if ! command -v "${TOOLING_DOWNLOAD_COMMAND}" >/dev/null 2>&1; then
        echo "error: ${TOOLING_DOWNLOAD_COMMAND} is required to install ${tool_name}" >&2
        exit 1
    fi
}

# resolve_os - Maps the current OS to one of two caller-provided values.
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
            echo "error: unsupported OS for ${tool_name} (${uname_s})" >&2
            exit 1
            ;;
    esac
}

# resolve_arch - Maps the current architecture to one of two caller-provided values.
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
            echo "error: unsupported architecture for ${tool_name} (${uname_m})" >&2
            exit 1
            ;;
    esac
}
