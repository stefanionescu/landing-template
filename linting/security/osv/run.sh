#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINTING_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_DIR="${LINTING_DIR}/config/security"

# shellcheck source=../install.sh
source "${SCRIPT_DIR}/../install.sh"
load_security_config "${CONFIG_DIR}" "osv.env"

TOOLS_DIR="${LINTING_DIR}/${SECURITY_TOOLS_RELATIVE_DIR}"
BIN_DIR="${TOOLS_DIR}/${OSV_SCANNER_TOOL_NAME}"

# install_fallback — Downloads, verifies, and installs a pinned osv-scanner release as a local fallback.
install_fallback() {
    require_download_command "${OSV_SCANNER_TOOL_NAME}"
    mkdir -p "${BIN_DIR}"
    local os arch version asset checksums_asset base_url
    os="$(resolve_os "${OSV_SCANNER_OS_DARWIN}" "${OSV_SCANNER_OS_LINUX}" "${OSV_SCANNER_TOOL_NAME}")"
    arch="$(resolve_arch "${OSV_SCANNER_ARCH_AMD64}" "${OSV_SCANNER_ARCH_ARM64}" "${OSV_SCANNER_TOOL_NAME}")"
    version="${OSV_SCANNER_VERSION}"
    asset="${OSV_SCANNER_ASSET_PREFIX}_${os}_${arch}"
    checksums_asset="${OSV_SCANNER_CHECKSUMS_ASSET}"
    base_url="${OSV_SCANNER_RELEASE_BASE_URL}/v${version}"
    local tmp_dir
    tmp_dir="$(download_and_verify "${base_url}" "${asset}" "${checksums_asset}")"
    trap 'rm -rf "'"${tmp_dir}"'"' RETURN
    install -m 0755 "${tmp_dir}/${asset}" "${BIN_DIR}/${OSV_SCANNER_TOOL_NAME}"
}

# Skip when no lock files exist — nothing for the scanner to analyze.
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
has_lockfile=false
for f in bun.lock package-lock.json yarn.lock pnpm-lock.yaml; do
    [[ -f "${PROJECT_ROOT}/${f}" ]] && has_lockfile=true && break
done
if [[ "${has_lockfile}" == "false" ]]; then
    echo "no lock file found — skipping osv-scanner"
    exit 0
fi

if command -v "${OSV_SCANNER_TOOL_NAME}" >/dev/null 2>&1; then
    exec "${OSV_SCANNER_TOOL_NAME}" "$@"
fi

FALLBACK_BIN="${BIN_DIR}/${OSV_SCANNER_TOOL_NAME}"
if [[ ! -x "${FALLBACK_BIN}" ]]; then
    echo "installing fallback ${OSV_SCANNER_TOOL_NAME} ${OSV_SCANNER_VERSION}..." >&2
    install_fallback
fi

exec "${FALLBACK_BIN}" "$@"
