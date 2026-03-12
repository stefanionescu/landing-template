#!/usr/bin/env bash
# Repo-local Lizard wrapper.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/python.sh"

run_python_tool "lizard" "${LIZARD_VERSION}" "lizard" "lizard" "lizard" "$@"
