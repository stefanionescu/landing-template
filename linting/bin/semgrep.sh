#!/usr/bin/env bash
# Repo-local Semgrep wrapper.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lint:justify -- reason: sourced helper path is resolved relative to this script -- ticket: N/A
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/python.sh"

prepend_python_warning_filter "ignore:urllib3 v2 only supports OpenSSL 1.1.1+:Warning"
run_python_tool "semgrep" "${SEMGREP_VERSION}" "semgrep" "semgrep" "semgrep" "$@"
