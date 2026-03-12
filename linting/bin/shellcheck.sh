#!/usr/bin/env bash
# Repo-local ShellCheck wrapper.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/github.sh"

tag="v${SHELLCHECK_VERSION}"
asset_name="shellcheck-${tag}.$(resolve_os "darwin" "linux" "shellcheck").$(resolve_arch "x86_64" "aarch64" "shellcheck").tar.gz"

run_github_tar_tool \
    "shellcheck" \
    "${SHELLCHECK_VERSION}" \
    "${SHELLCHECK_GITHUB_REPO}" \
    "shellcheck" \
    "shellcheck" \
    "${tag}" \
    "${asset_name}" \
    "shellcheck-${tag}/shellcheck" \
    "$@"
