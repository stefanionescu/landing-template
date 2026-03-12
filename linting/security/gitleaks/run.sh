#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINTING_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_DIR="${LINTING_DIR}/config/security"

# shellcheck source=../install.sh
source "${SCRIPT_DIR}/../install.sh"
load_security_config "${CONFIG_DIR}" "gitleaks/gitleaks.env"

TOOLS_DIR="${LINTING_DIR}/${SECURITY_TOOLS_RELATIVE_DIR}"
BIN_DIR="${TOOLS_DIR}/${GITLEAKS_TOOL_NAME}"
LOCAL_BIN="${BIN_DIR}/${GITLEAKS_TOOL_NAME}"
VERSION_FILE="${BIN_DIR}/.version"

# tool_is_current - Returns success when the local binary matches the pinned version marker.
tool_is_current() {
    [[ -x "${LOCAL_BIN}" && -f "${VERSION_FILE}" && "$(<"${VERSION_FILE}")" == "${GITLEAKS_VERSION}" ]]
}

# install_local - Downloads, verifies, and installs the pinned gitleaks release.
install_local() {
    require_download_command "${GITLEAKS_TOOL_NAME}"
    mkdir -p "${BIN_DIR}"
    local os arch version asset checksums_asset base_url
    os="$(resolve_os "${GITLEAKS_OS_DARWIN}" "${GITLEAKS_OS_LINUX}" "${GITLEAKS_TOOL_NAME}")"
    arch="$(resolve_arch "${GITLEAKS_ARCH_X64}" "${GITLEAKS_ARCH_ARM64}" "${GITLEAKS_TOOL_NAME}")"
    version="${GITLEAKS_VERSION}"
    asset="${GITLEAKS_ARCHIVE_PREFIX}_${version}_${os}_${arch}.tar.gz"
    checksums_asset="${GITLEAKS_ARCHIVE_PREFIX}_${version}_${GITLEAKS_CHECKSUMS_SUFFIX}"
    base_url="${GITLEAKS_RELEASE_BASE_URL}/v${version}"
    local tmp_dir
    tmp_dir="$(download_and_verify "${base_url}" "${asset}" "${checksums_asset}")"
    trap 'rm -rf "'"${tmp_dir}"'"' RETURN
    tar -xzf "${tmp_dir}/${asset}" -C "${tmp_dir}"
    install -m 0755 "${tmp_dir}/${GITLEAKS_TOOL_NAME}" "${LOCAL_BIN}"
    printf '%s\n' "${GITLEAKS_VERSION}" >"${VERSION_FILE}"
}

if [[ "${1:-}" == "bootstrap" ]]; then
    if ! tool_is_current; then
        echo "installing local ${GITLEAKS_TOOL_NAME} ${GITLEAKS_VERSION}..." >&2
        install_local
    fi
    exit 0
fi

if tool_is_current; then
    exec "${LOCAL_BIN}" "$@"
fi

if [[ "${LANDING_BOOTSTRAP_TOOL:-0}" == "1" ]]; then
    echo "installing local ${GITLEAKS_TOOL_NAME} ${GITLEAKS_VERSION}..." >&2
    install_local
    exec "${LOCAL_BIN}" "$@"
fi

echo "error: ${GITLEAKS_TOOL_NAME} ${GITLEAKS_VERSION} is not bootstrapped. Run: bun run setup:tooling" >&2
exit 1
