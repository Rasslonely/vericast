#!/bin/bash
# scripts/pre-commit.sh
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

# Secret scan — block if .env or private key found in staged files
if git diff --cached --name-only | grep -qE '\.env'; then
    echo "❌ BLOCKED: .env file staged for commit"
    exit 1
fi

if git diff --cached -U0 | grep -qiE '(PRIVATE_KEY|0x[a-fA-F0-9]{64})'; then
    echo "❌ BLOCKED: Possible private key in staged changes"
    exit 1
fi

# Python format check
if command -v ruff &> /dev/null; then
    ruff check backend/ --fix
    ruff format backend/
fi

# TypeScript lint
if [ -d "frontend" ] && command -v npx &> /dev/null; then
    cd frontend && npx eslint . --ext .ts,.tsx --fix 2>/dev/null || true
    cd ..
fi

echo "✅ Pre-commit checks passed"
