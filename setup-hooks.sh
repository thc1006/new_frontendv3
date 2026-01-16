#!/usr/bin/env bash
# Setup Git Hooks for WiSDON Frontend Project
# Run this script once after cloning the repository

set -e

echo "Setting up Git hooks..."
git config core.hooksPath .githooks

echo "Git hooks enabled successfully!"
echo ""
echo "Hooks configured:"
echo "  - pre-commit: ESLint check on staged .vue/.ts/.js files"
echo "  - commit-msg: Validate commit message format (conventional commits)"
echo "  - pre-push: TypeScript type check"
echo ""
echo "To disable hooks, run: git config --unset core.hooksPath"
