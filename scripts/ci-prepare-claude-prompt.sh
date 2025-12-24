#!/bin/bash
# Prepare Claude system prompt for PR review
# This script reads the system prompt file and sets it as an environment variable
# Required: GITHUB_ENV environment variable must be set
set -e

echo "🔍 Preparing Claude system prompt..."

# Read system prompt from file
if [ ! -f ".claude/prompts/claude-review-system-prompt.md" ]; then
  echo "❌ Claude system prompt file not found at .claude/prompts/claude-review-system-prompt.md"
  exit 1
fi

SYSTEM_PROMPT=$(cat .claude/prompts/claude-review-system-prompt.md)

# Store in GITHUB_ENV using heredoc (no expression limit)
{
  echo 'SYSTEM_PROMPT_CONTENT<<PROMPT_EOF'
  echo "$SYSTEM_PROMPT"
  echo 'PROMPT_EOF'
} >> "$GITHUB_ENV"

echo "✅ Claude system prompt prepared successfully"

