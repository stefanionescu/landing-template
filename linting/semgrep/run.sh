#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONFIG_FILE="${REPO_ROOT}/linting/config/semgrep.sh"

if [[ ! -f "${CONFIG_FILE}" ]]; then
    echo "error: missing ${CONFIG_FILE}" >&2
    exit 1
fi

# lint:justify -- reason: config file sourced at runtime from resolved repo path -- ticket: N/A
# shellcheck disable=SC1090
source "${CONFIG_FILE}"

target="${1:-${SEMGREP_DEFAULT_TARGET}}"
exit_code=0

# run_target - Runs semgrep for a configured scan target.
run_target() {
    local label="$1"
    local custom_config="$2"
    local -n scan_paths_ref="$3"
    local -n rulesets_ref="$4"

    echo "=== semgrep > ${label} ==="

    local semgrep_cmd=(bash "${REPO_ROOT}/linting/bin/semgrep.sh" "${SEMGREP_FLAGS[@]}")
    semgrep_cmd+=(--config "${REPO_ROOT}/${custom_config}")

    for ruleset in "${rulesets_ref[@]}"; do
        semgrep_cmd+=(--config "${ruleset}")
    done

    local absolute_paths=()
    for scan_path in "${scan_paths_ref[@]}"; do
        absolute_paths+=("${REPO_ROOT}/${scan_path}")
    done

    semgrep_cmd+=("${absolute_paths[@]}")

    "${semgrep_cmd[@]}" || exit_code=1
}

# run_app - Runs semgrep against app scan paths.
run_app() {
    run_target "app" "${SEMGREP_APP_CONFIG_FILE}" SEMGREP_APP_SCAN_PATHS SEMGREP_APP_RULESETS
}

# run_hooks - Runs semgrep against hook scan paths.
run_hooks() {
    run_target "hooks" "${SEMGREP_HOOKS_CONFIG_FILE}" SEMGREP_HOOKS_SCAN_PATHS SEMGREP_HOOKS_RULESETS
}

case "${target}" in
    all)
        run_app
        run_hooks
        ;;
    app)
        run_app
        ;;
    hooks)
        run_hooks
        ;;
    *)
        echo "Usage: $0 <${SEMGREP_USAGE_TARGETS}>" >&2
        exit 1
        ;;
esac

exit "${exit_code}"
