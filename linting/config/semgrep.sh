#!/usr/bin/env bash
# shellcheck shell=bash

# lint:justify -- reason: configuration file sourced by other scripts -- ticket: N/A
# shellcheck disable=SC2034

SEMGREP_DEFAULT_TARGET="all"
SEMGREP_USAGE_TARGETS="all|app|hooks"

SEMGREP_FLAGS=(
    --error
    --no-rewrite-rule-ids
    --metrics=off
    --disable-version-check
)

SEMGREP_APP_CONFIG_FILE="linting/semgrep/app.yml"
SEMGREP_APP_SCAN_PATHS=(
    "server.js"
    "build/"
    "shared/"
    "config/"
    "functions/"
    "pages/landing/"
)
SEMGREP_APP_RULESETS=(
    p/javascript
    p/nodejs
    p/command-injection
    p/owasp-top-ten
    p/secrets
    r/bash
)

SEMGREP_HOOKS_CONFIG_FILE="linting/semgrep/hooks.yml"
SEMGREP_HOOKS_SCAN_PATHS=(
    ".githooks/"
)
SEMGREP_HOOKS_RULESETS=(
    r/bash
)
