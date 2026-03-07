#!/bin/bash
# Shared security tool config loading helpers.

# require_file — Exits with an error if the given file path does not exist.
require_file() {
    local file_path="$1"
    if [[ ! -f "${file_path}" ]]; then
        echo "error: missing ${file_path}" >&2
        exit 1
    fi
}

# load_security_config — Sources common, tool-specific, and version config from the security config directory.
load_security_config() {
    local config_dir="$1"
    local tool_config_relative="$2"
    local common="${config_dir}/common.env"
    local tool="${config_dir}/${tool_config_relative}"
    local versions="${config_dir}/tool-versions.env"
    require_file "${common}"
    require_file "${tool}"
    require_file "${versions}"
    # lint:justify -- reason: file sourced at runtime, path not resolvable statically -- ticket: N/A
    # shellcheck disable=SC1090
    source "${common}"
    # lint:justify -- reason: file sourced at runtime, path not resolvable statically -- ticket: N/A
    # shellcheck disable=SC1090
    source "${tool}"
    # lint:justify -- reason: file sourced at runtime, path not resolvable statically -- ticket: N/A
    # shellcheck disable=SC1090
    source "${versions}"
}
