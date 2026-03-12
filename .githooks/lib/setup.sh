#!/usr/bin/env bash

set -e

ROOT_DIR="$(git rev-parse --show-toplevel)"

echo "Setting up Git hooks..."
git config core.hooksPath .githooks

echo "Bootstrapping repo-local lint/security tooling..."
bash "${ROOT_DIR}/linting/install/bootstrap.sh"

echo "Git hooks installed."
echo ""
echo "Bypass flags:"
echo "  git commit --no-verify"
echo "  git push --no-verify"
echo "  SKIP_HOOKS=1 git commit"
echo "  SKIP_HOOKS=1 git push"
echo "  SKIP_COMMITLINT=1 git commit"
echo ""
echo "Commit-specific flags:"
echo "  SKIP_ENV_CHECK=1 git commit"
echo "  SKIP_REPO_LINT=1 git commit"
echo "  SKIP_TYPOS=1 git commit"
echo "  SKIP_LINT_PKG=1 git commit"
echo "  SKIP_HOOKS_SELF=1 git commit"
echo ""
echo "Push-specific flags:"
echo "  SKIP_SECURITY_SCANS=1 git push"
echo "  SKIP_MARKDOWN_LINT=1 git push"
echo "  SKIP_EXTERNAL_LINKS=1 git push"
echo "  SKIP_LICENSE_CHECK=1 git push"
echo "  SKIP_HOOKS_SELF=1 git push"
