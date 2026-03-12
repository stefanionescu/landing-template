#!/usr/bin/env bash
# Repo-local shfmt CLI wrapper.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/github.sh"

tag="v${SHFMT_VERSION}"
asset_name="shfmt_${tag}_$(resolve_os "darwin" "linux" "shfmt")_$(resolve_arch "amd64" "arm64" "shfmt")"

run_github_binary_tool \
    "shfmt" \
    "${SHFMT_VERSION}" \
    "${SHFMT_GITHUB_REPO}" \
    "shfmt" \
    "shfmt" \
    "${tag}" \
    "${asset_name}" \
    "$@"
