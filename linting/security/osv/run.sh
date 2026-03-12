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
LOCAL_BIN="${BIN_DIR}/${OSV_SCANNER_TOOL_NAME}"
VERSION_FILE="${BIN_DIR}/.version"

# tool_is_current - Returns success when the local binary matches the pinned version marker.
tool_is_current() {
    [[ -x "${LOCAL_BIN}" && -f "${VERSION_FILE}" && "$(<"${VERSION_FILE}")" == "${OSV_SCANNER_VERSION}" ]]
}

# install_local - Downloads, verifies, and installs the pinned osv-scanner release.
install_local() {
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
    install -m 0755 "${tmp_dir}/${asset}" "${LOCAL_BIN}"
    printf '%s\n' "${OSV_SCANNER_VERSION}" >"${VERSION_FILE}"
}

if [[ "${1:-}" == "bootstrap" ]]; then
    if ! tool_is_current; then
        echo "installing local ${OSV_SCANNER_TOOL_NAME} ${OSV_SCANNER_VERSION}..." >&2
        install_local
    fi
    exit 0
fi

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

if tool_is_current; then
    exec "${LOCAL_BIN}" "$@"
fi

if [[ "${LANDING_BOOTSTRAP_TOOL:-0}" == "1" ]]; then
    echo "installing local ${OSV_SCANNER_TOOL_NAME} ${OSV_SCANNER_VERSION}..." >&2
    install_local
    exec "${LOCAL_BIN}" "$@"
fi

echo "error: ${OSV_SCANNER_TOOL_NAME} ${OSV_SCANNER_VERSION} is not bootstrapped. Run: bun run setup:tooling" >&2
exit 1
