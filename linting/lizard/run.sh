#!/usr/bin/env bash
# Cyclomatic complexity analysis using Lizard.
# Usage: run.sh <all|runtime|hooks|linting>

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

LIZARD_CCN_THRESHOLD=10
LIZARD_NLOC_THRESHOLD=60
LIZARD_ARGS_THRESHOLD=5

LIZARD_FLAGS=(
    --CCN "${LIZARD_CCN_THRESHOLD}"
    --length "${LIZARD_NLOC_THRESHOLD}"
    --arguments "${LIZARD_ARGS_THRESHOLD}"
)

target="${1:-all}"
exit_code=0

# run_project - Runs lizard for a project, loading its .whitelizard if present.
run_project() {
    local label="$1"
    local whitelist="$2"
    shift 2
    local dirs=("$@")

    local flags=("${LIZARD_FLAGS[@]}")
    if [[ -f "$whitelist" ]]; then
        flags+=(--whitelist "$whitelist")
    fi

    echo "=== lizard > ${label} ==="
    bash "${REPO_ROOT}/linting/bin/lizard.sh" "${flags[@]}" "${dirs[@]}" || exit_code=1
}

# run_runtime - Runs lizard complexity analysis on runtime JS code.
run_runtime() {
    run_project "runtime" ".whitelizard" \
        "server.js" \
        "build/" \
        "shared/" \
        "config/" \
        "functions/"
}

# run_hooks - Runs lizard complexity analysis on git hooks.
run_hooks() {
    run_project "hooks" ".whitelizard" ".githooks/"
}

# run_linting - Runs lizard complexity analysis on linting scripts.
run_linting() {
    local linting_files=()
    while IFS= read -r file_path; do
        linting_files+=("${file_path}")
    done < <(
        find "linting" \
            -path "linting/.tools" -prune -o \
            -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.sh' \) \
            -print
    )

    run_project "linting" ".whitelizard" "${linting_files[@]}"
}

# cd so lizard reports relative paths (needed for whitelist matching).
cd "$REPO_ROOT"

case "$target" in
    all)
        run_runtime
        run_hooks
        run_linting
        ;;
    runtime) run_runtime ;;
    hooks) run_hooks ;;
    linting) run_linting ;;
    *)
        echo "Usage: $0 <all|runtime|hooks|linting>" >&2
        exit 1
        ;;
esac

exit "$exit_code"
