#!/usr/bin/env bash
# GitHub release download helpers for repo-local lint tooling.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/common.sh"

# github_asset_metadata - Prints one asset URL and SHA-256 digest from the GitHub release API.
github_asset_metadata() {
    local repo="$1"
    local tag="$2"
    local asset_name="$3"

    require_bun

    # lint:justify -- reason: bun inline script is single-quoted to prevent shell interpolation -- ticket: N/A
    # shellcheck disable=SC2016
    TOOLING_GITHUB_REPO_NAME="${repo}" \
        TOOLING_GITHUB_RELEASE_TAG="${tag}" \
        TOOLING_GITHUB_ASSET_NAME="${asset_name}" \
        TOOLING_GITHUB_API_ROOT="${TOOLING_GITHUB_API_BASE}" \
        bun -e '
const repo = process.env.TOOLING_GITHUB_REPO_NAME;
const tag = process.env.TOOLING_GITHUB_RELEASE_TAG;
const assetName = process.env.TOOLING_GITHUB_ASSET_NAME;
const apiRoot = process.env.TOOLING_GITHUB_API_ROOT;
const releaseUrl = `${apiRoot}/${repo}/releases/tags/${tag}`;
const response = await fetch(releaseUrl, {
  headers: {
    "Accept": "application/vnd.github+json",
    "User-Agent": "landing-template-tooling"
  }
});
if (!response.ok) {
  console.error(`error: github api request failed (${response.status}) for ${releaseUrl}`);
  process.exit(1);
}
const release = await response.json();
const asset = release.assets?.find((entry) => entry.name === assetName);
if (!asset) {
  console.error(`error: github asset not found: ${repo}@${tag}/${assetName}`);
  process.exit(1);
}
const digest = String(asset.digest || "");
if (!digest.startsWith("sha256:")) {
  console.error(`error: github asset missing sha256 digest: ${repo}@${tag}/${assetName}`);
  process.exit(1);
}
console.log(asset.browser_download_url);
console.log(digest.slice("sha256:".length));
'
}

# download_github_asset - Downloads one GitHub release asset and verifies its SHA-256 digest.
download_github_asset() {
    local repo="$1"
    local tag="$2"
    local asset_name="$3"
    local destination_path="$4"

    require_download_command "${asset_name}"

    local metadata download_url expected_sha actual_sha
    metadata="$(github_asset_metadata "${repo}" "${tag}" "${asset_name}")"
    download_url="$(printf '%s\n' "${metadata}" | sed -n '1p')"
    expected_sha="$(printf '%s\n' "${metadata}" | sed -n '2p')"

    if [[ -z "${download_url}" || -z "${expected_sha}" ]]; then
        echo "error: incomplete metadata for ${repo}@${tag}/${asset_name}" >&2
        exit 1
    fi

    "${TOOLING_DOWNLOAD_COMMAND}" -fsSL "${download_url}" -o "${destination_path}"

    actual_sha="$(sha256_file "${destination_path}")"
    if [[ "${actual_sha}" != "${expected_sha}" ]]; then
        echo "error: checksum mismatch for ${asset_name}" >&2
        echo "expected: ${expected_sha}" >&2
        echo "actual:   ${actual_sha}" >&2
        exit 1
    fi
}
