#!/usr/bin/env bash
set -euo pipefail

# Install git hooks for the project

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "Installing git hooks..."

# Create pre-commit hook
cat > "$GIT_HOOKS_DIR/pre-commit" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "Running pre-commit hook: formatting and linting staged files..."

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|css)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo "No files to format/lint, skipping."
    exit 0
fi

# Format staged files
echo "$STAGED_FILES" | xargs npx biome format --write

# Re-stage formatted files
echo "$STAGED_FILES" | xargs git add

# Lint staged files
echo "$STAGED_FILES" | xargs npx biome lint

if [ $? -ne 0 ]; then
    echo "❌ Lint failed. Please fix issues before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
EOF

# Make the hook executable
chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Pre-commit hook will run: npm run format && npm run lint"
echo ""
echo "To bypass the hook (not recommended):"
echo "  git commit --no-verify"
