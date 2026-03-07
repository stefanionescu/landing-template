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

# install_fallback — Downloads, verifies, and installs a pinned gitleaks release as a local fallback.
install_fallback() {
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
    install -m 0755 "${tmp_dir}/${GITLEAKS_TOOL_NAME}" "${BIN_DIR}/${GITLEAKS_TOOL_NAME}"
}

if command -v "${GITLEAKS_TOOL_NAME}" >/dev/null 2>&1; then
    exec "${GITLEAKS_TOOL_NAME}" "$@"
fi

FALLBACK_BIN="${BIN_DIR}/${GITLEAKS_TOOL_NAME}"
if [[ ! -x "${FALLBACK_BIN}" ]]; then
    echo "installing fallback ${GITLEAKS_TOOL_NAME} ${GITLEAKS_VERSION}..." >&2
    install_fallback
fi

exec "${FALLBACK_BIN}" "$@"
