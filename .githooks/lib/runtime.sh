#!/usr/bin/env bash
# Shared helpers for git hook scripts.

_LIB_DIR="$(dirname "${BASH_SOURCE[0]}")"
source "$_LIB_DIR/config.sh"
source "$_LIB_DIR/timeout.sh"

# require_tool - Aborts when a required CLI is missing.
require_tool() {
    local tool="$1"
    local hint="$2"
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "$tool not installed ($hint)"
        exit 1
    fi
}

# run_hook_no_stdin - Runs one hook script and records failure output.
run_hook_no_stdin() {
    local name="$1"
    local skip_var="$2"
    local script="$3"
    shift 3
    local args=("$@")

    if [[ "${!skip_var:-0}" == "1" ]]; then
        return 0
    fi

    if [[ ! -x "$script" ]]; then
        return 0
    fi

    set +e
    OUTPUT="$("$script" "${args[@]}" 2>&1)"
    STATUS=$?
    set -e

    if [[ "$OUTPUT" != "skip" ]] && [[ $STATUS -ne 0 ]]; then
        echo -e "${RED}${name}${NC}"
        [[ -n "$OUTPUT" ]] && echo "$OUTPUT"
        # lint:justify -- reason: FAILED is set for the calling hook orchestrator -- ticket: N/A
        # shellcheck disable=SC2034
        FAILED=1
    fi
}

# parse_hook_mode - Parses hook mode from CLI arg.
parse_hook_mode() {
    case "${1:-}" in
        --mode=commit | commit) echo "commit" ;;
        --mode=push | push) echo "push" ;;
        *) echo "unknown" ;;
    esac
}

# get_hook_files - Lists tracked hook scripts and entrypoints.
get_hook_files() {
    git ls-files | grep -E "$HOOK_FILE_PATTERN" || true
}

# get_hook_files_array - Loads hook file paths into FILES array.
get_hook_files_array() {
    local file_list
    file_list="$(get_hook_files)"

    FILES=()
    while IFS= read -r path; do
        if [[ -n "$path" && -f "$ROOT_DIR/$path" ]]; then
            FILES+=("$path")
        fi
    done <<<"$file_list"

    if [[ "${#FILES[@]}" -eq 0 ]]; then
        exit 0
    fi
}
